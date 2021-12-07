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
  startCountdownLength: 15,
  initialViewScale: 110,
  maxViewScale: 256,
  minViewScale: 70,
  zoomAmountOnCollect: 0.25,
  initialSnakeSize: 5,
  numPickupsPerMinute: 100,
  pickupCap: 500,
  baseMoveSpeed: 20,
  baseAccelSpeed: 80,
  sprintMult: 4,
  sprintCostPerSecond: 6,
  scoreLengthDivider: 5,
  startTimerLength: 10,
  roundTimerLength: 900,
  gameEndTimerLength: 15
};

export class State {
  constructor(_io) {
    this.io = _io;
    //Game state
    this.game = {
      //Track the game state
      gameState: GAME_STATES.GAME_WAITING_FOR_PLAYERS,
      gameStateTimer: 0,
      //Store all player objects
      players: {},
      pickups: {}
    };
    //Score state
    this.score = {
      //Who won the game
      winners: undefined
    };
    //Physics state
    this.physics = {
      //Game Objects. Game object ID will be set by the server
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
    this.level = {
      activeLevelData: undefined
    };
  }
}
