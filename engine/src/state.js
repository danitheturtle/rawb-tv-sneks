export const GAME_STATES = {
  GAME_WAITING_FOR_PLAYERS: 'GAME_WAITING_FOR_PLAYERS',
  GAME_STARTING_SOON: 'GAME_STARTING_SOON',
  GAME_PLAYING: 'GAME_PLAYING',
  GAME_OVER: 'GAME_OVER',
  GAME_RESETTING: 'GAME_RESETTING'
};

export const GLOBALS = {
  gameLength: 180,
  endscreenLength: 10,
  startCountdownLength: 15
};

export class State {
  constructor(_io) {
    this.io = _io;
    //Game state
    this.game = {
      //Track the game state
      gameState: GAME_STATES.GAME_WAITING_FOR_PLAYERS,
      //Store all player objects
      players: {},
      activeLevel: undefined
    };
    //Score state
    this.score = {
      //Who won the game
      winners: undefined
    };
    //Physics state
    this.physics = {
      //Game object unique ID tracker
      lastGameObjectID: 0,
      //Physics globals (see physics.js for more info)
      speedLimit: 0,
      moveSpeed: undefined,
      sprintMult: undefined,
      //Game Objects
      gameObjects: {}
    };
    //Timer state
    this.time = {
      //Delta time
      dt: 0,
      //Total time the app has been running
      runTime: 0,
      //Timestamp of the last update loop
      lastTime: 0,
      //Current frames per second
      fps: 0,
      //Timers for individual clients so that syncing can happen properly
      clientTimers: {},
      //General timers with unique ids
      timers: {}
    };
  }
}
