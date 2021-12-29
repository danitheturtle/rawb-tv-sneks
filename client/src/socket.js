import engine from 'engine';
import Victor from 'victor';
import { CLIENT_STATES } from './clientState';
import * as levelLoader from './clientLevelLoader';
import * as drawing from './drawing';
import { PlayerRenderer } from './drawing/playerRenderer';
import { SpriteRenderer } from './drawing/spriteRenderer';
const { Player, physics: { SnakeCollider, CircleCollider }, Pickup, time, GLOBALS } = engine;
const Vector = Victor;

let socket;

export const init = (_state) => {
  //Setup shorthand
  const s = _state;
  const sg = s.game;
  const sp = s.physics;
  const st = s.time;
  const sv = s.view;
  socket = s.io;

  //Listen for new players
  socket.on('newPlayer', (data) => {
    //Add the new player to the list
    if (data.id != sg.clientId) {
      sp.gameObjects[data.id] = sg.players[data.id] = new Player()
        .addCollider(new SnakeCollider())
        .addRenderer(new PlayerRenderer())
        .setData(data);
    }
  });
  
  //Listen for all players
  socket.on('allPlayers', (_players) => {
    _players.forEach(data => {
      sp.gameObjects[data.id] = sg.players[data.id] = new Player()
        .addCollider(new SnakeCollider())
        .addRenderer(new PlayerRenderer())
        .setData(data);
    });
  });

  //Listen for players leaving
  socket.on('removePlayer', (clientId) => {
    //Remove that player from the state
    delete sp.gameObjects[clientId];
    delete sg.players[clientId];
  });

  socket.on('playerDied', (data) => {
    if (!sg.players[data.id]) return;
    sg.players[data.id].setData(data);
    if (data.id == sg.clientId) {
      sv.active?.reset(s);
      sg.players[data.id].dead = false;
      socket.emit('playerRespawned', data.id);
    }
  });
  
  const updatePickup = (pickupData) => {
    if (sg.pickups[pickupData.id]) {
      sg.pickups[pickupData.id].setData(pickupData);
    } else {
      sp.gameObjects[pickupData.id] = sg.pickups[pickupData.id] = new Pickup()
        .addCollider(new CircleCollider())
        .addRenderer(new SpriteRenderer())
        .setData({
          ...pickupData,
          renderer: { radius: 1, spriteName: pickupData.pickupType }
        });
    }
  }
  
  socket.on('allPickups', (pickupsData) => {
    Object.keys(sg.pickups).forEach(pickupId => {
      delete sp.gameObjects[pickupId];
      delete sg.pickups[pickupId];
    });
    pickupsData.forEach(pickupData => {
      updatePickup(pickupData);
    });
  });
  
  socket.on('updatePickup', (pickupData) => {
    updatePickup(pickupData);
  });
  
  socket.on('collectedPickup', ({ clientId, pickupId, worth }) => {
    if (!sg.pickups[pickupId]) return;
    if (clientId && clientId != sg.clientId) {
      sg.players[clientId].score += sg.pickups[pickupId].worth;
      sg.players[clientId].collider.updateBodyWithScore()
    }
    delete sp.gameObjects[pickupId];
    delete sg.pickups[pickupId];
  });

  //Listen for game state changes
  socket.on("updateGameState", (newState) => {
    //Update things based on server-authoritative state
    s.game.gameState = newState.gameState;
    s.game.gameStateTimer = newState.gameStateTimer;
    s.game.scoreboard = newState.scoreboard?.sort(([_, __, plScore1], [___, ____, plScore2]) => plScore1 > plScore2 ? -1 : 1);
    s.score.winner = newState.winnerID;
    
    //Update players
    //Loop through every player in the data
    for (const clientId in newState.players) {
      //If a player sent by the server doesn't exist on the client
      if (!sg.players[clientId]) {
        //Create that player
        sp.gameObjects[clientId] = sg.players[clientId] = new Player()
          .addCollider(new SnakeCollider())
          .addRenderer(new PlayerRenderer())
          .setData(newState.players[clientId]);
      } else {
        //If the player is not the client player
        if (sg.clientId == clientId) {
          //Set data but remain client-authoritative
          sg.players[clientId].setClientDataFromServerUpdate(newState.players[clientId]);
        } else {
          //Set the data
          sg.players[clientId].setData(newState.players[clientId]);
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

export const createNewPlayer = (_state, _playerNameValue) => {
  console.dir('joining game');
  //client-defined player data
  const clientPlayerData = { name: _playerNameValue, spriteName: _state.game.playerSpriteValue || drawing.randomPlayerSprite() };
  //notify server there is a new player
  socket.emit('createNewPlayer', clientPlayerData);
}

/**
 * Called by the client to update the server (and everyone else) of changes
 */
export const updateClientPlayer = (_state) => {
  //Get the client player data
  const playerData = _state.game.players[_state.game.clientId].getClientUpdateData();
  //Emit an update
  socket.emit('updatePlayer', playerData);
}

export const playerCollectedPickup = (_state, _clientId, _pickupId) => {
  socket.emit('playerCollectedPickup', { clientId: _clientId, pickupId: _pickupId });
  delete _state.physics.gameObjects[_pickupId];
  delete _state.game.pickups[_pickupId];
}
