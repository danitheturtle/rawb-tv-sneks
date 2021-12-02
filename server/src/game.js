import engine from 'engine';
import Victor from 'victor';
import * as levelLoader from './serverLevelLoader';
import * as scoring from './serverScoring';
import { ServerState, SERVER_STATES } from './serverState';
const Vector = Victor;
const {
  time,
  utils,
  physics,
  BoxCollider,
  CircleCollider,
  GameObject,
  Player,
  SnakeCollider
} = engine;

// ref variables so I can type quicker
let state;
let players;
let sp, st, sg, sl;

/**
 * Used to initialize the game.  It initializes other modules and gets shorthand variables
 */
export const init = (_io) => {
  state = new ServerState(_io);
  time.init(state);
  physics.init(state);
  levelLoader.init(state);
  scoring.init(state);
  players = state.game.players;
  sp = state.physics;
  st = state.time;
  sg = state.game;
  sl = state.level;
}

export const start = () => {
  physics.start();
  levelLoader.start();
}

/**
 * The game update loop
 * Runs at 60fps on the server
 */
export const updateGame = () => {
  //Set timeout to self-call this function at 60FPS
  setTimeout(updateGame, (1000 / 60));
  //Update other modules
  time.update();
  physics.update();

  //Update all players
  for (const clientId in players) {
    // if (players[clientId].dead) continue;
    //find collision with other players
    for (const otherId in players) {
      if (otherId === clientId) continue;
      if (players[clientId].collider.checkCollisionWithOtherSnake(players[otherId].collider)) {
        players[otherId].die();
        state.io.emit('playerDied', otherId);
      }
    }
    //Detect pickups
    for (const pickupId in sg.pickups) {
      if (players[clientId].collider.checkCollisionWithPickup(sg.pickups[pickupId])) {
        sg.pickups[pickupId].collectedBy = clientId;
        sg.collectedPickups.push(sg.pickups[pickupId]);
        players[clientId].collider.increaseBodyPartCount(sg.pickups[pickupId].worth);
        delete sp.gameObjects[pickupId];
        delete sg.pickups[pickupId];
      }
    }
  }
  scoring.update();
}

/**
 * The network update Loop
 * updates clients of changes at 30fps
 */
export const updateNetwork = () => {
  //Set timeout to call this method again
  setTimeout(updateNetwork, (1000 / 30));

  //Grab player data to send to clients
  let playerData = {};
  for (const i in players) {
    let curData = playerData[players[i].id] = players[i].getData();
    curData.serverTime = st.clientTimers[players[i].id];
  }
  //Emit the full player list to the new client
  state.io.emit('allPlayers', playerData);

  //Get game state data
  let updatedGameState = {
    gameState: sg.gameState,
    gameStartTimer: st.timers.gameStartTimer,
    gameTimer: st.timers.gameTimer,
    gameOverTimer: st.timers.gameOverTimer,
    collectedPickups: sg.collectedPickups.map(p => p.getData()),
    newPickups: sg.newPickups.map(p => p.getData())
  };
  //Emit up-to-date game state to all clients
  state.io.emit('updateGameState', updatedGameState);
  sg.collectedPickups = [];
  sg.newPickups = [];
}

/**
 * This function will update the server's version of a specific player's data from
 * their game client.
 */
export const updatePlayerFromClient = (socket, data) => {
  players[data.id].setData(data);
}

/**
 * Creates and adds a new player to the game.  Sends that player their client ID
 */

export const addNewPlayer = (socket, clientData) => {
  //Create an ID for this player
  let newPlayerId = sp.lastGameObjectID++;

  //Create a new player object and store it in the array
  players[newPlayerId] = new Player(
    state, 
    newPlayerId, 
    new Vector(utils.randomInt(5, 70), utils.randomInt(5, 60)),
    new Vector(0.0, 0.0),
    new Vector(0.0, 0.0),
    new SnakeCollider(2)
  );
  Object.keys(clientData).forEach(key => {
    players[newPlayerId][key] = clientData[key];
  });
  time.startClientTimer(newPlayerId, 0);

  //Emit the new player's id to their client
  socket.emit('setClientID', newPlayerId);
  //Load the active level on the client, if there is one, and pickups
  if (sl.activeLevelData) {
    socket.emit('loadLevel', sl.activeLevelData.name)
    socket.emit('allPickups', Object.values(sg.pickups).map(pickup => pickup.getData()));
  }

  //Add server time to the response
  let newPlayerData = players[newPlayerId].getData();
  newPlayerData.time = st.clientTimers[newPlayerId];
  //Emit the new player to all connected clients
  state.io.emit('newPlayer', newPlayerData);

  //Return the new player's ID
  return newPlayerId;
}

export const disconnectPlayer = (clientId) => {
  //Remove the player's Game Object
  delete sp.gameObjects[clientId];
  //Remove the player's timer
  delete st.clientTimers[clientId];
  //Remove the player's data in the player array
  delete players[clientId];
  //Emit that a player disconnected
  state.io.emit('removePlayer', clientId);
}
