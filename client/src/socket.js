import engine from 'engine';
import Victor from 'victor';
import { CLIENT_STATES } from './clientState';
import * as levelLoader from './clientLevelLoader';
import * as drawing from './drawing';
const { Player, Pickup, GLOBALS } = engine;
const Vector = Victor;

export const sortScoreboard = (scoreboard) => {
  //we expect the scoreboard to be mostly-sorted most of the time, making index sort the fastest choice for sorting
  for(let i = 0; i < scoreboard.length; i++) {
    let cur = scoreboard[i];
    for(let j = i + 1; j < scoreboard.length; j++) {
      let next = scoreboard[j];
      if(cur[3] < next[3] || (cur[3] == next[3] && cur[0] > next[0])) {//absolute ordering on players
        scoreboard[j - 1] = next;
        scoreboard[j] = cur;
      } else {
        break;
      }
    }
  }
}

export const setListeners = (s) => {//TODO: add error logging for malformed packets
  //Setup shorthand
  //This is very bad because now there is not a single authoritative pointer to the current game state, but js does not really make it practical to remove this without a lot of work
  let sg = s.game;
  let sv = s.view;
  let socket = s.io;

  //Listen for new players
  socket.on('newPlayer', (data) => {
    //Add the new player to the list
    let pl = sg.players[data.id];
    if (!pl) {//we might already know about this player from allPlayers
      pl = new Player();
      sg.players[data.id] = pl;
      sg.scoreboard.push([data.id, pl.playerName, pl.score]);
      sortScoreboard(sg.scoreboard);
    }
    pl.setFromServer(data);
  });

  //Listen for all players
  socket.on('allPlayers', (_players) => {
    sg.players = {};
    sg.scoreboard = [];
    _players.forEach(data => {
      let pl = new Player();
      pl.setFromServer(data);
      sg.players[data.id] = pl;
      sg.scoreboard.push([data.id, pl.playerName, pl.score]);
      sortScoreboard(sg.scoreboard);
    });
  });

  //Listen for players leaving
  socket.on('removePlayer', (playerId) => {
    //remove from scoreboard
    //TODO: check to make sure an empty scoreboard is handled correctly everywhere
    let hasRemoved = false;
    for(let i = 0; i < sg.scoreboard.length; i++) {
      if(sg.scoreboard[i][0] == playerId) {
        hasRemoved = true;
      } else if(hasRemoved) {
        sg.scoreboard[i] = sg.scoreboard[i - 1];
      }
    }
    if(hasRemoved) {
      sg.scoreboard.length--;
    } else {
      console.debug('scoreboard wasn\'t synced', playerId, sg.players[playerId]);
    }
    if(!sg.players[playerId]) {
      console.debug('player removed wasn\'t synced', playerId);
    }
    delete sg.players[playerId];
  });

  socket.on('playerDied', (playerId) => {
    sg.players[playerId].dead = true;
  });

  socket.on('playerRespawning', (data) => {
    console.log("respawn", data);
    if (!sg.players[data.id]) return;
    sg.players[data.id].respawnFromServer(data);
    if (data.id == sg.clientId) {
      sv.active?.reset(s);
      console.dir('broadcasted respawn');
    }
    sortScoreboard(sg.scoreboard);
  });

  socket.on('allPickups', (pickupsData) => {
    sg.pickups = {};
    pickupsData.forEach(data => {
      sg.pickups[data.id] = new Pickup(data.pickupType, data.x, data.y);
    });
  });

  socket.on('updatePickup', (data) => {
    let pickup = sg.pickups[data.id];
    if (pickup) {
      pickup.pickupType = data.pickupType;
      pickup.x = data.x;
      pickup.y = data.y;
    } else {
      sg.pickups[data.id] = new Pickup(data.pickupType, data.x, data.y);
    }
  });

  socket.on('collectedPickup', ({ playerId, pickupId, score }) => {
    if (!sg.pickups[pickupId]) {
      console.debug('pickup collected that wasn\'t synced', playerId, pickupId);
    }
    if (playerId && playerId != sg.clientId) {
      //we assume client players stay in sync without these updates
      let pl = sg.players[playerId];
      pl.score = score;
      pl.updateBodyWithScore();
      sortScoreboard(sg.scoreboard);
    }
    delete sg.pickups[pickupId];
  });

  //Listen for game state changes
  socket.on('updateGameState', (newState) => {//TODO: send these updates with data depending on the current game state
    //Update things based on server-authoritative state
    sg.gameState = newState.gameState;
    sg.gameStartTimer = newState.gameStartTimer;
    sg.gameEndTimer = newState.gameEndTimer;
    sg.roundTimer = newState.roundTimer;
    sg.serverTime = newState.serverTime;
    // s.score.winner = newState.winnerID;

    //Update players
    //Loop through every player in the data
    for (const data in newState.players) {
      //If a player sent by the server doesn't exist on the client
      let id = data.id;
      if (!sg.players[id]) {
        //Create the player, this should never be run since we should not receive updates for non-existant players
        console.debug('player updated that wasn\'t synced', data);
        let pl = new Player();
        pl.updateFromServer(data);
        sg.players[id] = pl;
      } else {
        if (sg.clientId == id) {
          //remain client-authoritative
        } else {
          sg.players[id].updateFromServer(data);
        }
      }
    }
  });

  //Listen for the server sending this client its ID
  socket.on('setClientID', (_clientId) => {
    //Set our id
    sg.clientId = _clientId;
    //getting an ID means game has been joined
    sg.joinedGame = true;
    sg.joiningGame = false;
  });

  socket.on('loadLevel', (levelName) => {
    levelLoader.loadLevel(s, levelName);
    //update game state to move on from connecting
    sg.clientState = CLIENT_STATES.PLAYING
  });
}


export const reset = (s) => {
  let sg = s.game;
  let socket = s.io;
  socket.emit('reset', sg.clientId);
}

export const createNewPlayer = (s, _playerNameValue) => {
  let sg = s.game;
  let socket = s.io;
  console.dir('joining game');
  //client-defined player data
  const clientPlayerData = { playerName: _playerNameValue, spriteName: sg.playerSpriteValue || drawing.randomPlayerSprite() };
  //notify server there is a new player
  socket.emit('createNewPlayer', clientPlayerData);
}

/**
 * Called by the client to update the server (and everyone else) of changes
 */
export const updateClientPlayer = (s) => {
  let sg = s.game;
  let socket = s.io;

  socket.emit('updatePlayer', sg.players[sg.clientId].getForUpdateFromClient());
}

export const playerCollectedPickup = (s, clientId, pickupId) => {
  let sg = s.game;
  let socket = s.io;

  socket.emit('playerCollectedPickup', { playerId: clientId, pickupId: pickupId });
}
