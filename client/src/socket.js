import engine from 'engine';
import Victor from 'victor';
import { CLIENT_STATES } from './clientState';
import * as levelLoader from './clientLevelLoader';
import * as drawing from './drawing';
import { PlayerRenderer } from './drawing/playerRenderer';
import { SpriteRenderer } from './drawing/spriteRenderer';
const { Player, SnakeCollider, Pickup, CircleCollider, time } = engine;
const Vector = Victor;

let s, sg, sp, st, socket;

export const init = (_state) => {
  //Setup shorthand
  s = _state;
  sg = s.game;
  sp = s.physics;
  st = s.time;
  socket = s.io;

  //Listen for new players
  socket.on('newPlayer', (data) => {
    //Add the new player to the list
    sg.players[data.id] = new Player(
      s,
      data.id,
      new Vector(data.x, data.y),
      new Vector(data.velX, data.velY),
      new Vector(data.accelX, data.accelY),
      new SnakeCollider(2),
      new PlayerRenderer(3, data.spriteName)
    );
    //Start a client timer for that player
    time.startClientTimer(data.id, data.time);
    //Set that player's data in the game state
    sg.players[data.id].setData(data);
  });

  //Listen for players leaving
  socket.on('removePlayer', (clientId) => {
    //Remove that player from the state
    delete sp.gameObjects[clientId];
    delete st.clientTimers[clientId];
    delete sg.players[clientId];
  });

  socket.on('playerDied', (clientId) => {
    sg.players[clientId]?.die();
  });

  socket.on('playerRespawning', (data) => {
    sg.players[data.id].setData(data);
    sg.players[data.id].respawned();
    if (data.id == sg.clientId) {
      updateClientPlayer();
      console.dir('broadcasted respawn');
    }
  });
  
  socket.on('collectedPickup', ({ clientId, worth }) => {
    sg.players[clientId].collider.increaseBodyPartCount(worth);
  });

  //Listen for game state changes
  socket.on("updateGameState", (newState) => {
    //Update things based on server-authoritative state
    s.game.gameState = newState.gameState;
    s.score.winner = newState.winnerID;
    s.time.timers.gameStartTimer = newState.gameStartTimer;
    s.time.timers.gameTimer = newState.gameTimer;
    s.time.timers.gameOverTimer = newState.gameOverTimer;
    //get pickups again from server
    const newPickupIds = Object.keys(newState.pickups);
    const clientPickupIds = Object.keys(sg.pickups);
    clientPickupIds.filter(cid => {
      return !newPickupIds.includes(cid)
    }).forEach(deletableId => {
      delete sp.gameObjects[deletableId];
      delete sg.pickups[deletableId];
    });
    newPickupIds.forEach(newId => {
      const newData = newState.pickups[newId];
      if (!sg.pickups[newId]) {
        sg.pickups[newId] = new Pickup(
          s,
          newData.id,
          new Vector(newData.x, newData.y),
          newData.worth,
          new CircleCollider(1),
          new SpriteRenderer(1, "regularCheese")
        );
      }
      sg.pickups[newId].setData(newData);
    })
    //Update players
    //Loop through every player in the data
    for (const clientId in newState.players) {
      //If a player sent by the server doesn't exist on the client
      if (!sg.players[clientId]) {
        const newPlayerData = newState.players[clientId];
        //Create that player
        sg.players[clientId] = new Player(
          s,
          clientId,
          new Vector(newPlayerData.x, newPlayerData.y),
          new Vector(newPlayerData.velX, newPlayerData.velY),
          new Vector(newPlayerData.accelX, newPlayerData.accelY),
          new SnakeCollider(2),
          new PlayerRenderer(3, newPlayerData.spriteName)
        );
        sg.players[clientId].setData(newPlayerData);
      } else {
        //If the player is not the client player
        if (sg.clientId == clientId) {
          //Set data but remain client-authoritative
          sg.players[clientId].setClientData(newState.players[clientId]);
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
    levelLoader.loadLevel(levelName);
    //update game state to move on from connecting
    sg.clientState = CLIENT_STATES.PLAYING
  });
}


export const start = () => {}

export const createNewPlayer = () => {
  console.dir('joining game');
  //client-defined player data
  const clientPlayerData = { spriteName: drawing.randomPlayerSprite() };
  //notify server there is a new player
  socket.emit('createNewPlayer', clientPlayerData);
}

/**
 * Called by the client to update the server (and everyone else) of changes
 */
export const updateClientPlayer = () => {
  //Get the client player data
  const playerData = sg.players[sg.clientId].getData();
  //Grab the client's time
  playerData.time = st.clientTimers[sg.clientId];
  //Emit an update
  socket.emit('updatePlayer', playerData);
}
