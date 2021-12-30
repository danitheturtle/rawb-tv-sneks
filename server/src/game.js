import engine from 'engine';
import Victor from 'victor';
import * as scoring from './serverScoring';
import { SERVER_STATES} from './serverState';
const Vector = Victor;
const {
  GLOBALS,
  time,
  utils,
  physics,
  Player,
  Pickup
} = engine;
const {
  CircleCollider,
  GameObject,
  SnakeCollider
} = physics;

// ref variables so I can type quicker
let players;

export const playerDied = (_state, clientId) => {
  const s = _state;
  const sg = s.game;
  const sp = s.physics;
  const sl = s.level;
  const deadPlayer = sg.players[clientId];
  if (!deadPlayer) return;
  deadPlayer.collider.pointPath?.forEach(point => {
    const newPickupId = `pickup-${point.x}-${point.y}`;
    if (!sg.pickups[newPickupId]) { 
      const pickupType = scoring.randomPickupType();
      sp.gameObjects[newPickupId] = sg.pickups[newPickupId] = new Pickup()
        .addCollider(new CircleCollider())
        .setData({
          id: newPickupId,
          x: point.x,
          y: point.y,
          pickupType: pickupType[0],
          worth: pickupType[1],
          collider: {
            radius: 1
          }
        });
      s.io.emit('updatePickup', sg.pickups[newPickupId].getData());
    }
  });
  deadPlayer.score = 0;
  deadPlayer.pos.x = utils.randomInt(5, sl.activeLevelData.guWidth - 5);
  deadPlayer.pos.y = utils.randomInt(5, sl.activeLevelData.guHeight - 5);
  deadPlayer.collider.reset(s);
  deadPlayer.invincibleTimer = GLOBALS.invincibleSecondsOnDeath;
  scoring.updatePlayerScore(s, clientId);
  s.io.emit('playerDied', deadPlayer.getData());
}

/**
 * The game update loop
 * Runs at 60fps on the server
 */
let networkUpdateTicker = 0;
export const updateGame = (_state) => {
  const s = _state;
  const sg = s.game;
  const st = s.time;
  const sp = s.physics;
  const sl = s.level;
  //Set timeout to self-call this function at 60FPS
  setTimeout(() => updateGame(s), (1000 / 60));
  //Update other modules
  time.update(s);
  physics.update(s);

  //Update all players
  for (const clientId in sg.players) {
    if (sg.players[clientId].dead) continue;
    //check out of bounds
    if (sg.players[clientId].isOutOfBounds(s)) {
      playerDied(s, clientId);
      continue;
    }
    //find collision with other players
    for (const otherId in sg.players) {
      if (
        otherId === clientId || 
        sg.players[otherId].dead || 
        sg.players[clientId].dead || 
        sg.players[clientId].invincibleTimer > 0.01 || 
        sg.players[otherId].invincibleTimer > 0.01
      ) {
        continue;
      }
      const collisionResult = sg.players[clientId].collider.checkCollisionWithOtherSnake(sg.players[otherId].collider);
      if (collisionResult === 1) {
        playerDied(s, otherId);
      } else if (collisionResult === 2) {
        playerDied(s, clientId);
      } else if (collisionResult === 3) {
        playerDied(s, clientId);
        playerDied(s, otherId);
      }
    }
    //If sprinting, update score
    if (sg.players[clientId].sprint) {
      scoring.updatePlayerScore(s, clientId);
    }
  }
  
  scoring.update(s);
  
  switch(sg.gameState) {
    case SERVER_STATES.GAME_WAITING_FOR_PLAYERS:
      if (Object.keys(sg.players).length >= 2) {
        sg.gameState = SERVER_STATES.GAME_STARTING_SOON;
      }
      break;
    case SERVER_STATES.GAME_OVER:
      if (time.getTimer(s, 'gameEndTimer') === undefined) {
        time.startNewTimer(s, 'gameEndTimer');
      }
      sg.gameStateTimer = time.getTimer(s, 'gameEndTimer');
      if (time.getTimer(s, 'gameEndTimer') >= GLOBALS.gameEndTimerLength) {
        time.stopTimer(s, 'gameEndTimer');
        if (Object.keys(sg.players).length >= 2) {
          sg.gameState = SERVER_STATES.GAME_STARTING_SOON;
        } else {
          sg.gameState = SERVER_STATES.GAME_WAITING_FOR_PLAYERS;
        }
      }
      break;
    case SERVER_STATES.GAME_STARTING_SOON:
      if (time.getTimer('gameStartTimer') === undefined) {
        time.startNewTimer(s, 'gameStartTimer');
      }
      if (Object.keys(sg.players).length < 2) {
        sg.gameState = SERVER_STATES.GAME_WAITING_FOR_PLAYERS;
        time.stopTimer(s, 'gameStartTimer');
      }
      sg.gameStateTimer = time.getTimer('gameStartTimer');
      if (time.getTimer(s, 'gameStartTimer') >= GLOBALS.startTimerLength) {
        time.stopTimer(s, 'gameStartTimer');
        sg.gameState = SERVER_STATES.GAME_RESETTING;
      }
      break;
    case SERVER_STATES.GAME_RESETTING:
      scoring.reset(s);
      Object.values(sg.players).forEach(pl => {
        playerDied(s, pl.id);
        sg.scoreboard.push([pl.id, pl.name, pl.score]);
      });
      sg.gameState = SERVER_STATES.GAME_PLAYING;
      break;
    case SERVER_STATES.GAME_PLAYING:
    default:
      if (time.getTimer(s, 'roundTimer') === undefined) {
        time.startNewTimer(s, 'roundTimer');
      }
      sg.gameStateTimer = time.getTimer(s, 'roundTimer');
      if (time.getTimer(s, 'roundTimer') >= GLOBALS.roundTimerLength || Object.keys(sg.players).length < 2) {
        time.stopTimer(s, 'roundTimer')
        sg.gameState = SERVER_STATES.GAME_OVER;
      }
      break;
  }
  //Network update at 1/3 speed - 20 fps
  networkUpdateTicker = networkUpdateTicker + 1 > 3 ? 0 : networkUpdateTicker + 1;
  if (networkUpdateTicker % 3 === 0) {
    //Grab player data to send to clients
    let playerData = {};
    for (const clientId in sg.players) {
      playerData[clientId] = sg.players[clientId].getServerUpdateData();
    }
    //Grab changed pickup data to send to clients
    let pickupData = {};
    for (const pickupId in sg.pickups) {
      if (sg.pickups[pickupId].dirty) {
        pickupData[pickupId] = sg.pickups[pickupId].getServerUpdateData();
      }
    }
    
    //Get game state data
    let updatedGameState = {
      gameState: sg.gameState,
      gameStateTimer: sg.gameStateTimer,
      scoreboard: sg.scoreboard,
      players: playerData,
      pickups: pickupData
    };
    //Emit up-to-date game state to all clients
    s.io.emit('updateGameState', updatedGameState);
  }
}

/**
 * This function will update the server's version of a specific player's data from
 * their game client.
 */
export const updatePlayerFromClient = (_state, socket, data) => {
  const sg = _state.game;
  if (!sg.players[data.id].dead) {
    sg.players[data.id].setData(data);
  }
}

/**
 * This function updates a pickup on the server using data from the client
 */
export const updatePickupFromClient = (_state, _pickupId, _data) => {
  const sg = _state.game;
  if (sg.pickups[_pickupId]) {
    sg.pickups[_pickupId].setData(_data);
    sg.pickups[_pickupId].dirty = true;
  }
}

/**
 * Player picked up an item
 */
export const playerCollectedPickup = (_state, { clientId, pickupId }) => {
  const sg = _state.game;
  const sp = _state.physics;
  if (sg.pickups[pickupId] && sg.players[clientId]) {
    sg.players[clientId].score += sg.pickups[pickupId].worth;
    sg.players[clientId].collider.updateBodyWithScore();
    scoring.updatePlayerScore(_state, clientId);
    _state.io.emit('collectedPickup', { clientId, pickupId, worth: sg.pickups[pickupId].worth });
    delete sp.gameObjects[pickupId];
    delete sg.pickups[pickupId];
  }
}

/**
 * Player respawned
 */
export const playerRespawned = (_state, clientId) => {
  _state.game.players[clientId].dead = false;
}

/**
 * Creates and adds a new player to the game.  Sends that player their client ID
 */
export const addNewPlayer = (_state, socket, clientData) => {
  //Create an ID for this player
  let newPlayerId = _state.physics.lastGameObjectID++;

  //Create a new player object and store it in the array
  _state.physics.gameObjects[newPlayerId] = _state.game.players[newPlayerId] = new Player(_state)
    .addCollider(new SnakeCollider())
    .setData({
      id: newPlayerId,
      x: utils.randomInt(5, _state.level.activeLevelData.guWidth - 5),
      y: utils.randomInt(5, _state.level.activeLevelData.guHeight - 5),
      ...clientData
    });
    
  scoring.updatePlayerScore(_state, newPlayerId);

  //Emit the new player's id to their client
  socket.emit('setClientID', newPlayerId);
  //Load the active level on the client, if there is one, and pickups
  if (_state.level.activeLevelData) {
    socket.emit('loadLevel', _state.level.activeLevelData.name);
    //Emit all pickup objects
    socket.emit('allPickups', Object.values(_state.game.pickups).map(pickupRef => pickupRef.getData()))
    //Emit all players
    socket.emit('allPlayers', Object.values(_state.game.players).map(playerRef => playerRef.getData()))
  }
  const newData = _state.game.players[newPlayerId].getData();
  //Emit the new player to all connected clients
  _state.io.emit('newPlayer', newData);

  //Return the new player's ID
  return newPlayerId;
}

export const disconnectPlayer = (_state, clientId) => {
  //Remove the player's Game Object
  delete _state.physics.gameObjects[clientId];
  //Remove the player's data in the player array
  delete _state.game.players[clientId];
  //find and remove the player from scoreboard
  delete _state.game.scoreboard.splice(_state.game.scoreboard.indexOf(_state.game.scoreboard.find(plScore => plScore[0] === clientId)), 1);
  
  //Emit that a player disconnected
  _state.io.emit('removePlayer', clientId);
}
