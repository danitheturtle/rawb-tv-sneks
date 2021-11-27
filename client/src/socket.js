import engine from 'engine';
import Victor from 'victor';
import { CLIENT_STATES } from './state';
const Vector = Victor;
const { Player, CircleCollider, time } = engine;
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
      new CircleCollider(2)
    );
    //Start a client timer for that player
    time.startClientTimer(data.id, data.time);
    //Set that player's data in the game state
    sg.players[data.id].setData(data);
  });

  //Listen for players leaving
  socket.on('removePlayer', (id) => {
    //Remove that player from the state
    delete sp.gameObjects[sg.players[id].gameObject.id];
    delete st.clientTimers[sg.players[id]];
    delete sg.players[id];
  });

  //Listen for game state changes
  socket.on("updateGameState", (newState) => {
    //Update things based on server-authoritative state
    s.game.gameState = newState.gameState;
    s.score.winner = newState.winnerID;
    s.time.timers.gameStartTimer = newState.gameStartTimer;
    s.time.timers.gameTimer = newState.gameTimer;
    s.time.timers.gameOverTimer = newState.gameOverTimer;
  });

  //Resets the game when the server detects a reset game state
  socket.on('resetGame', () => {
    //Reset client-specific game state to the defaults
    s.game.gameState = CLIENT_STATES.GAME_WAITING_FOR_PLAYERS;
  });

  //Listen for the server sending this client its ID
  socket.on('setClientID', (id) => {
    //Set our id
    sg.clientID = id;
    //Set the game state to playing now that the connection has been established
    sg.clientState = CLIENT_STATES.PLAYING;
  });

  socket.on('allPlayers', function(data) {
    //Loop through every player in the data
    for (const id in data) {
      //If a player sent by the server doesn't exist on the client
      if (!sg.players[id]) {
        //Create that player
        sg.players[id] = new Player(
          s,
          data[id].id,
          new Vector(data[id].x, data[id].y),
          new CircleCollider(2),
          new Vector(data[id].velX, data[id].velY),
          new Vector(data[id].accelX, data[id].accelY)
        );
      }
      //If the player is not the client player
      if (sg.clientID != id) {
        //Set the data
        sg.players[id].setData(data[id]);
        //Else, the player is the client player
      } else {
        //Set data but remain client-authoritative
        sg.players[id].setClientData(data[id]);
      }
    }
  });
}


export const start = () => {
  //notify server there is a new player
  socket.emit('createNewPlayer');
}

/**
 * Called by the client to update the server (and everyone else) of changes
 */
export const updateClientPlayer = () => {
  //Get the client player data
  const playerData = sg.players[sg.clientID].getData();
  //Grab the client's time
  playerData.time = st.clientTimers[sg.clientID];
  //Emit an update
  socket.emit('updatePlayer', playerData);
}
