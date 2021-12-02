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
    sg.players[data.clientId] = new Player(
      s,
      data.clientId,
      new Vector(data.x, data.y),
      new Vector(data.velX, data.velY),
      new Vector(data.accelX, data.accelY),
      new SnakeCollider(2),
      new PlayerRenderer(3, data.spriteName)
    );
    //Start a client timer for that player
    time.startClientTimer(data.clientId, data.time);
    //Set that player's data in the game state
    sg.players[data.clientId].setData(data);
  });

  //Listen for players leaving
  socket.on('removePlayer', (clientId) => {
    //Remove that player from the state
    delete sp.gameObjects[sg.players[clientId].id];
    delete st.clientTimers[sg.players[clientId]];
    delete sg.players[clientId];
  });
  
  //Listen for player death
  socket.on('playerDied', (clientId) => {
    sg.players[clientId].die();
  })

  //Listen for game state changes
  socket.on("updateGameState", (newState) => {
    //Update things based on server-authoritative state
    s.game.gameState = newState.gameState;
    s.score.winner = newState.winnerID;
    s.time.timers.gameStartTimer = newState.gameStartTimer;
    s.time.timers.gameTimer = newState.gameTimer;
    s.time.timers.gameOverTimer = newState.gameOverTimer;
    newState.newPickups?.forEach(pickup => {
      sg.pickups[pickup.pickupId] = new Pickup(
        s, 
        pickup.pickupId, 
        new Vector(pickup.x, pickup.y), 
        pickup.worth, 
        new CircleCollider(1), 
        new SpriteRenderer(1, "regularCheese")
      );
    });
    newState.collectedPickups?.forEach(collectedPickup => {
      if (sg.pickups[collectedPickup.pickupId]) {
        delete sp.gameObjects[sg.pickups[collectedPickup.pickupId].id];
        delete sg.pickups[collectedPickup.pickupId];
        sg.players[collectedPickup.collectedBy].collider.increaseBodyPartCount(collectedPickup.worth)
      }
    })
  });

  //Resets the game when the server detects a reset game state
  socket.on('resetGame', () => {
    //Reset client-specific game state to the defaults
    s.game.gameState = CLIENT_STATES.GAME_WAITING_FOR_PLAYERS;
  });

  //Listen for the server sending this client its ID
  socket.on('setClientID', (_clientId) => {
    //Set our id
    sg.clientId = _clientId;
    //getting an ID means game has been joined
    sg.joinedGame = true;
  });

  socket.on('loadLevel', (levelName) => {
    levelLoader.loadLevel(levelName);
    //update game state to move on from connecting
    sg.clientState = CLIENT_STATES.PLAYING
  });
  
  socket.on('allPickups', (pickupData) => {
    pickupData.forEach(pickup => {
      sg.pickups[pickup.pickupId] = new Pickup(
        s, pickup.pickupId, 
        new Vector(pickup.x, pickup.y), 
        pickup.worth, 
        new CircleCollider(1), 
        new SpriteRenderer(1, "regularCheese")
      );
    });
  });
  
  socket.on('allPlayers', function(data) {
    // console.dir(data);
    //Loop through every player in the data
    for (const clientId in data) {
      //If a player sent by the server doesn't exist on the client
      if (!sg.players[clientId]) {
        //Create that player
        sg.players[clientId] = new Player(
          s,
          data[clientId].clientId,
          new Vector(data[clientId].x, data[clientId].y),
          new Vector(data[clientId].velX, data[clientId].velY),
          new Vector(data[clientId].accelX, data[clientId].accelY),
          new SnakeCollider(2),
          new PlayerRenderer(3, data[clientId].spriteName)
        );
      }
      //If the player is not the client player
      if (sg.clientId == clientId) {
        //Set data but remain client-authoritative
        sg.players[clientId].setClientData(data[clientId]);
      } else {
        //Set the data
        sg.players[clientId].setData(data[clientId]);
        //Else, the player is the client player
      }
    }
  });
}


export const start = () => {
}

export const createNewPlayer = () => {
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
