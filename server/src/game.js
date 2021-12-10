import engine from 'engine';
import Victor from 'victor';
import * as levelLoader from './serverLevelLoader';
import * as scoring from './serverScoring';
import { ServerState, SERVER_STATES} from './serverState';
const Vector = Victor;
const {
  GLOBALS,
  utils,
  Player,
} = engine;

/**
* Used to initialize the game.  It initializes other modules and gets shorthand variables
*/
export const init = (s) => {
  levelLoader.init(s);
}

/**
* The game update loop
* Runs at 60fps on the server
*/
export const updateGame = (s) => {
  // Set timeout to self-call this function at 60FPS
  setTimeout(() => {
    updateGame(s);
  }, (1000 / 60));

  let sg = s.game;

  let dt = s.updateTimeFromSystem();

  switch(sg.gameState) {
    case SERVER_STATES.GAME_WAITING_FOR_PLAYERS:
    if (Object.keys(sg.players).length >= 2) {
      sg.gameState = SERVER_STATES.GAME_STARTING_SOON;
    }
    break;

    case SERVER_STATES.GAME_OVER:
    if (sg.gameEndTimer === undefined) {
      sg.gameEndTimer = s.runTime;
    }
    if ((s.runTime - sg.gameEndTimer) >= GLOBALS.gameEndTimerLength) {
      if (Object.keys(sg.players).length >= 2) {
        sg.gameEndTimer = undefined;
        sg.gameState = SERVER_STATES.GAME_STARTING_SOON;
      } else {
        sg.gameEndTimer = undefined;
        sg.gameState = SERVER_STATES.GAME_WAITING_FOR_PLAYERS;
      }
    }
    break;

    case SERVER_STATES.GAME_STARTING_SOON:
    if (sg.gameStartTimer === undefined) {
      sg.gameStartTimer = s.runTime;
    }
    if (Object.keys(sg.players).length < 2) {
      sg.gameStartTimer = undefined;
      sg.gameState = SERVER_STATES.GAME_WAITING_FOR_PLAYERS;
    } else if ((s.runTime - sg.gameStartTimer) >= GLOBALS.startTimerLength) {

      //reset game
      scoring.resetPickups(s);
      for (uid in sg.players) {
        let pl = sg.players[uid];
        pl.dead = true;
        s.io.emit('playerDied', pl.id);
      }
      sg.pickupTimer = s.runTime;

      sg.gameStartTimer = undefined;
      sg.gameState = SERVER_STATES.GAME_PLAYING;

    }
    break;

    case SERVER_STATES.GAME_PLAYING:
    default:
    if (sg.roundTimer === undefined) {
      sg.roundTimer = s.runTime;
    }
    if ((s.runTime - sg.roundTimer) >= GLOBALS.roundTimerLength || Object.keys(sg.players).length < 2) {
      sg.roundTimer = undefined;
      sg.gameState = SERVER_STATES.GAME_OVER;
    }
    break;
  }

  const playerDied = (s, playerId, pl) => {//TODO: add a respawn timer
    pl.dead = true;

    s.io.emit('playerDied', Number(playerId));

    //Reset dead players and spawn pickups where they died
    let pointsX = pl.pointPathX;
    let pointsY = pl.pointPathY;
    for(let i = 0; i < pl.bodyPartCount; i++) {
      let j = Math.min(i, pointsX.length - 1);
      const pickupType = scoring.randomPickupType();

      scoring.spawnPickup(s, pickupType, pointsX[j], pointsY[j]);
    }

    //respawn
    pl.pos.x = utils.randomInt(5, sg.activeLevelData.guWidth - 5);
    pl.pos.y = utils.randomInt(5, sg.activeLevelData.guHeight - 5);
    pl.score = 0;
    pl.pointPathX = [];
    pl.pointPathY = [];
    pl.dead = false;

    console.debug('playerRespawning', pl.getForRespawnFromServer(Number(playerId)));
    s.io.emit('playerRespawning', pl.getForRespawnFromServer(Number(playerId)));
  }

  //Update all players
  for (const playerId in sg.players) {
    let pl = sg.players[playerId];
    if (pl.dead) continue;

    pl.update(s, dt);

    //check out of bounds
    if (pl.isOutOfBounds(s)) {
      console.debug('playerDied', 'outofbounds', Number(playerId));
      playerDied(s, playerId, pl);
    }
  }
  //find collision with other players
  for (const playerId0 in sg.players) {
    let pl0 = sg.players[playerId0];
    if(pl0.dead) continue;
    for (const playerId1 in sg.players) {
      let pl1 = sg.players[playerId1];
      //make sure we only iterate over every pair of sneks once
      if (playerId0 <= playerId1 || pl1.dead) continue;

      let code = pl0.checkCollisionWithOtherSnake(pl1);
      if (code == 3) {
        console.debug('playerDied', 'suicide', playerId0, playerId1);
        playerDied(s, playerId0, pl0);
        playerDied(s, playerId1, pl1);
      } else if (code == 2) {
        console.debug('playerDied', 'collide0', playerId0, playerId1);
        playerDied(s, playerId0, pl0);
      } else if (code == 1) {
        console.debug('playerDied', 'collide1', playerId0, playerId1);
        playerDied(s, playerId1, pl1);
      }
    }
  }

  //spawn pickups
  while ((s.runTime - sg.pickupTimer) > GLOBALS.secsPerPickup) {
    sg.pickupTimer += GLOBALS.secsPerPickup;

    let pickupType = scoring.randomPickupType();
    let x = utils.randomRange(0, sg.activeLevelData.guWidth)
    let y = utils.randomRange(0, sg.activeLevelData.guHeight)

    scoring.spawnPickup(s, pickupType, x, y);
  }

  //update clients
  if(s.runTime - s.networkTimer >= GLOBALS.secsPerNetworkUpdate) {
    s.networkTimer += GLOBALS.secsPerNetworkUpdate;

    //Grab player data to send to clients
    let playerData = [];
    for (const playerId in sg.players) {
      playerData.push(sg.players[playerId].getForUpdateFromServer(playerId));
    }

    //Get game state data
    let updatedGameState = {
      gameState: sg.gameState,
      gameStartTimer: sg.gameStartTimer,
      gameEndTimer: sg.gameEndTimer,
      roundTimer: sg.roundTimer,
      serverTime: sg.runTime,
      players: playerData
    };
    //Emit up-to-date game state to all clients
    s.io.emit('updateGameState', updatedGameState);
  }
}

export const reset = (s, playerId) => {
  let sg = s.game;
  sg.players[playerId].dead = true;

  s.io.emit('playerDied', playerId);

  scoring.resetPickups(s);
}

/**
* This function will update the server's version of a specific player's data from
* their game client.
*/
export const updatePlayerFromClient = (s, socket, data) => {
  let id = socket.clientId;
  // if (!sg.players[id].dead) {
  // }
  s.game.players[id].updateFromClient(data);
}

/**
* Player picked up an item
*/
export const playerCollectedPickup = (s, { playerId, pickupId }) => {
  let sg = s.game;

  let pl = sg.players[playerId];
  let pk = sg.players[pickupId];

  if (pk && pl) {

    pl.score += PICKUP_WORTHS[pk.pickupType];
    pl.updateBodyWithScore();

    console.debug('collectedPickup', { playerId, pickupId, score: pl.score });
    s.io.emit('collectedPickup', { playerId, pickupId, score: pl.score });

    sg.pickupsTotal--;
    delete sg.pickups[pickupId];
  }
}

/**
* Creates and adds a new player to the game.  Sends that player their client ID
*/

export const addNewPlayer = (s, socket, clientData) => {
  let sg = s.game;
  //Create an ID for this player
  let newPlayerId = sg.lastGameObjectUID++;

  //Create a new player object and store it in the array
  let player = new Player();

  player.pos.x = utils.randomInt(5, sg.activeLevelData.guWidth - 5);
  player.pos.y = utils.randomInt(5, sg.activeLevelData.guHeight - 5);

  player.playerName = clientData.playerName;
  player.spriteName = clientData.spriteName;
  sg.players[newPlayerId] = player;

  // scoring.updatePlayerScore(newPlayerId);

  socket.emit('setClientID', newPlayerId);
  //Load the active level on the client, if there is one, and pickups
  if (sg.activeLevelData) {
    socket.emit('loadLevel', sg.activeLevelData.name);

    let pickups = [];
    for(const pickupId in sg.pickups) {
      let pickup = sg.pickups[pickupId];
      pickups.push({
        id: pickupId,
        pickupType: pickup.pickupType,
        x: pickup.x,
        y: pickup.y,
      });
    }
    socket.emit('allPickups', pickups);

    let players = [];
    for(let playerId in sg.players) {
      players.push(sg.players[playerId].getForSetFromServer(Number(playerId)));
    }
    socket.emit('allPlayers', players);
  }

  console.debug('newPlayer', player.getForSetFromServer(newPlayerId));
  s.io.emit('newPlayer', player.getForSetFromServer(newPlayerId));

  return newPlayerId
}

export const disconnectPlayer = (s, playerId) => {
  let sg = s.game;
  //Remove the player's Game Object
  delete sg.players[playerId];

  //Emit that a player disconnected
  s.io.emit('removePlayer', playerId);
}
