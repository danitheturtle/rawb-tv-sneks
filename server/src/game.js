import engine from 'engine';
import Victor from 'victor';
import * as levelLoader from './serverLevelLoader';
import * as scoring from './serverScoring';
import { ServerState, SERVER_STATES} from './serverState';
const Vector = Victor;
const {
  GLOBALS,
  time,
  utils,
  physics,
  BoxCollider,
  CircleCollider,
  GameObject,
  Player,
  SnakeCollider,
  Pickup
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
  for (const clientId in sg.players) {
    if (sg.players[clientId].dead) continue;
    //check out of bounds
    if (sg.players[clientId].isOutOfBounds()) {
      sg.players[clientId].die();
      state.io.emit('playerDied', clientId);
      continue;
    }
    //find collision with other players
    for (const otherId in sg.players) {
      if (otherId === clientId || sg.players[otherId].dead) continue;
      if (sg.players[clientId].collider.checkCollisionWithOtherSnake(sg.players[otherId].collider)) {
        sg.players[otherId].die();
        state.io.emit('playerDied', otherId);
      }
    }
  }
  
  //Reset dead players and spawn pickups where they died
  for (const clientId in sg.players) {
    const deadPlayer = sg.players[clientId];
    //If player isn't dead, or if code has already run for them, skip
    if (!deadPlayer.dead || (deadPlayer.dead && deadPlayer.respawning)) continue;
    deadPlayer.collider.pointPath?.forEach(point => {
      const newPickupId = `pickup-${point.x}-${point.y}`;
      if (!sg.pickups[newPickupId]) { 
        sp.gameObjects[newPickupId] = sg.pickups[newPickupId] = new Pickup(state)
        .addCollider(new CircleCollider())
        .setData({
          id: newPickupId,
          x: point.x,
          y: point.y,
          collider: {
            radius: 1
          }
        });
        state.io.emit('updatePickup', sg.pickups[newPickupId].getData());
      }
    });
    deadPlayer.pos.x = utils.randomInt(5, sl.activeLevelData.guWidth - 5);
    deadPlayer.pos.y = utils.randomInt(5, sl.activeLevelData.guHeight - 5);
    deadPlayer.collider.reset();
    deadPlayer.respawn();
    state.io.emit('playerRespawning', deadPlayer.getData());
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
  for (const clientId in sg.players) {
    playerData[clientId] = sg.players[clientId].getDataForNetworkUpdate();
  }
  
  //Get game state data
  let updatedGameState = {
    gameState: sg.gameState,
    gameStartTimer: st.timers.gameStartTimer,
    gameTimer: st.timers.gameTimer,
    gameOverTimer: st.timers.gameOverTimer,
    players: playerData
  };
  //Emit up-to-date game state to all clients
  state.io.emit('updateGameState', updatedGameState);
}

export const reset = (clientId) => {
  sg.players[clientId].die();
  state.io.emit('playerDied', clientId);
  scoring.reset();
}

/**
 * This function will update the server's version of a specific player's data from
 * their game client.
 */
export const updatePlayerFromClient = (socket, data) => {
  if (!sg.players[data.id].dead || (sg.players[data.id].dead && sg.players[data.id].respawning)) {
    sg.players[data.id].setData(data);
  }
}

/**
 * Player picked up an item
 */
export const playerCollectedPickup = ({ clientId, pickupId }) => {
  if (sg.pickups[pickupId] && sg.players[clientId]) {
    sg.players[clientId].collider.increaseBodyPartCount(sg.pickups[pickupId].worth);
    state.io.emit('collectedPickup', { clientId, pickupId, worth: sg.pickups[pickupId].worth });
    delete sp.gameObjects[pickupId];
    delete sg.pickups[pickupId];
  }
}

/**
 * Creates and adds a new player to the game.  Sends that player their client ID
 */

export const addNewPlayer = (socket, clientData) => {
  //Create an ID for this player
  let newPlayerId = sp.lastGameObjectID++;

  //Create a new player object and store it in the array
  sp.gameObjects[newPlayerId] = sg.players[newPlayerId] = new Player(state)
    .addCollider(new SnakeCollider())
    .setData({
      id: newPlayerId,
      x: utils.randomInt(5, sl.activeLevelData.guWidth - 5),
      y: utils.randomInt(5, sl.activeLevelData.guHeight - 5),
      ...clientData
    });

  //Emit the new player's id to their client
  socket.emit('setClientID', newPlayerId);
  //Load the active level on the client, if there is one, and pickups
  if (sl.activeLevelData) {
    socket.emit('loadLevel', sl.activeLevelData.name);
    //Emit all pickup objects
    socket.emit('allPickups', Object.values(sg.pickups).map(pickupRef => pickupRef.getData()))
    //Emit all players
    socket.emit('allPlayers', Object.values(sg.players).map(playerRef => playerRef.getData()))
  }
  const newData = sg.players[newPlayerId].getData()
  //Emit the new player to all connected clients
  state.io.emit('newPlayer', newData);

  //Return the new player's ID
  return newPlayerId;
}

export const disconnectPlayer = (clientId) => {
  //Remove the player's Game Object
  delete sp.gameObjects[clientId];
  //Remove the player's data in the player array
  delete sg.players[clientId];
  //Emit that a player disconnected
  state.io.emit('removePlayer', clientId);
}
