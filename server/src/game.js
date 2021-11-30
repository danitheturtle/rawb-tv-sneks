import engine from 'engine';
import Victor from 'victor';
import * as levelLoader from './serverLevelLoader';
import { ServerState, SERVER_STATES } from './state';
const Vector = Victor;
const {
  scoring,
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
  scoring.update();

  //Update all players
  for (const id in players) {
    players[id].update();
  }
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
    let curData = playerData[players[i].clientId] = players[i].getData();
    curData.serverTime = st.clientTimers[players[i].clientId];
  }
  //Emit the full player list to the new client
  state.io.emit('allPlayers', playerData);

  //Get game state data
  let updatedGameState = {
    gameState: sg.gameState,
    gameStartTimer: st.timers.gameStartTimer,
    gameTimer: st.timers.gameTimer,
    gameOverTimer: st.timers.gameOverTimer
  };
  //Emit up-to-date game state to all clients
  state.io.emit('updateGameState', updatedGameState);
}

/**
 * This function will update the server's version of a specific player's data from
 * their game client.
 */
export const updatePlayerFromClient = (socket, data) => {
  players[data.clientId].setData(data);
}

/**
 * Creates and adds a new player to the game.  Sends that player their client ID
 */

export const addNewPlayer = (socket) => {
  //Create an ID for this player
  let clientId = sg.lastPlayerID++;

  //Create a new player object and store it in the array
  players[clientId] = new Player(
    state, 
    clientId, 
    new Vector(utils.randomInt(5, 70), utils.randomInt(5, 60)),
    new Vector(0.0, 0.0),
    new Vector(0.0, 0.0),
    new SnakeCollider(2)
  );
  time.startClientTimer(clientId, 0);

  //Emit the new player's id to their client
  socket.emit('setClientID', clientId);
  //Load the active level on the client, if there is one
  if (sl.activeLevelData) {
    socket.emit('loadLevel', sl.activeLevelData.name)
  }

  //Add server time to the response
  let newPlayerData = players[clientId].getData();
  newPlayerData.time = st.clientTimers[clientId];
  //Emit the new player to all connected clients
  state.io.emit('newPlayer', newPlayerData);

  //Return the new player's ID
  return clientId;
}

export const disconnectPlayer = (clientId) => {
  //Remove the player's Game Object
  delete sp.gameObjects[players[clientId].id];
  //Remove the player's timer
  delete st.clientTimers[clientId];
  //Remove the player's data in the player array
  delete players[clientId];
  //Emit that a player disconnected
  state.io.emit('removePlayer', clientId);
}
