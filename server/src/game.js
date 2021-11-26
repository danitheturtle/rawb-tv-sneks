import engine from 'engine';

const {
  State,
  scoring,
  time,
  utils,
  physics,
  levelLoader,
  GAME_STATES,
  BoxCollider,
  CircleCollider,
  GameObject,
  Player
} = engine;

// ref variables so I can type quicker
let state;
let io;
let players;
let sp, st, sg;

/**
 * Used to initialize the game.  It initializes other modules and gets shorthand variables
 */
export const init = (_io) => {
  state = new State();
  time.init(state);
  physics.init(state);
  levelLoader.init(state);
  io = _io;
  players = state.game.players;
  sp = state.physics;
  st = state.time;
  sg = state.game;

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
    let curData = playerData[players[i].id] = players[i].getData();
    curData.serverTime = st.clientTimers[players[i].id];
  }
  //Emit the full player list to the new client
  io.emit('allPlayers', playerData);

  //Get game state data
  let updatedGameState = {
    gameState: sg.gameState,
    gameStartTimer: st.timers.gameStartTimer,
    gameTimer: st.timers.gameTimer,
    gameOverTimer: st.timers.gameOverTimer
  };
  //Emit up-to-date game state to all clients
  io.emit('updateGameState', updatedGameState);
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

export const addNewPlayer = (socket) => {
  //Create an ID for this player
  let id = sg.lastPlayerID++;

  //Create a new player object and store it in the array
  players[id] = new Player(id, utils.randomInt(5, 70), utils.randomInt(5, 60));
  players[id].gameObject.hasGravity = true;
  time.startClientTimer(id, 0);

  //Emit the new player's id to their client
  socket.emit('setClientID', id);

  //Add server time to the response
  let newPlayerData = players[id].getData();
  newPlayerData.time = st.clientTimers[id];
  //Emit the new player to all connected clients
  io.emit('newPlayer', newPlayerData);

  //Return the new player's ID
  return id;
}

export const disconnectPlayer = (id) => {
  //Remove the player's Game Object
  delete sp.gameObjects[players[id].gameObject.id];
  //Remove the player's timer
  delete st.clientTimers[id];
  //Remove the player's data in the player array
  delete players[id];

  //If that player was the attacker
  if (state.score.attackingPlayerID == id) {
    //Force the scoring module to pick a new attacking player
    state.score.attackingPlayerID = undefined;
  }
  //Emit that a player disconnected
  io.emit('removePlayer', id);
}
