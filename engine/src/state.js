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
  initialSnakeRadius: 2,
  pickupCap: 500,
  baseMoveSpeed: 20,
  baseAccelSpeed: 80,
  sprintMult: 4,
  scoreLengthDivider: 5,
  startTimerLength: 10,
  roundTimerLength: 600,
  gameEndTimerLength: 15,

  secsPerPickup: 1.0/5.0,
  secsPerNetworkUpdate: 1.0/30.0,
  sprintCostPerSecond: 6.0,
  pickupRadius: 1,
  snakeBodySpacing: 2*1.8,
};



export const PICKUP_TYPES = {
	regularCheese: 0,
  goldenCheese: 1,
  pizzaCheese: 2,
  epicCheese: 3,
  fireyCheese: 4,
  squirrelCheese: 5,
  icyCheese: 6,
  hairyCheese: 7,
  diceyCheese: 8,
  radicalCheese: 9,
  wisdomCheese: 10,
}
export const PICKUP_NAMES = [
	"regularCheese",
  "goldenCheese",
  "pizzaCheese",
  "epicCheese",
  "fireyCheese",
  "squirrelCheese",
  "icyCheese",
  "hairyCheese",
  "diceyCheese",
  "radicalCheese",
  "wisdomCheese",
]

export const PICKUP_WORTHS = [
  1,
  2,
  3,
  4,
  5,
  5,
  5,
  5,
  5,
  10,
  10,
]
export const PICKUP_ODDS = [
  500,
  50,
  50,
  10,
  5,
  5,
  5,
  5,
  5,
  1,
  1
]

// export const newPickup = (x, y, pickupType) => {
//   return {
//     x: x,
//     y: y,
// 		radius: 1,
// 		pickupType: pickupType,
//   };
// }

export class Pickup {
	constructor(pickupType, x, y) {
	  this.pickupType = pickupType;
		this.x = x;
		this.y = y;
		// this.radius = 1;
	}
}

export class State {
  constructor(_io) {
    this.io = _io;
    //Game state
    this.game = {
      //Track the game state
      gameState: GAME_STATES.GAME_WAITING_FOR_PLAYERS,

      lastGameObjectUID: 0,
      //Store all player objects
      players: {},
      pickupsTotal: 0,
      pickups: {},

      playedLevelNames: [],
      activeLevelData: undefined,

      pickupTimer: 0.0,
      gameStartTimer: undefined,
      gameEndTimer: undefined,
      roundTimer: undefined,
    };
    //Total time this state has been running in sec
    this.networkTimer = 0;
    this.runTime = 0;
    this._lastSystemTimestamp = Date.now()/1000.0;
    //Score state
    this.score = {
      //Who won the game
      winners: undefined
    };
    // //Physics state
    // this.physics = {
    //   //Game Objects. Game object ID will be set by the server
    // };

    //Timer state
    // this.time = {
    //   //Delta time
    //   dt: 0,
    //   //Total time the app has been running
    //   runTime: 0,
    //   //Timestamp of the last update loop
    //   lastTime: 0,
    //   //Current frames per second
    //   fps: 0,
    //   //Timers for individual clients so that syncing can happen properly
    //   clientTimers: {},
    //   //General timers with unique ids
    //   timers: {}
    // };
    // this.level = {
    // };
  }

  updateTimeFromSystem() {
    let now = Date.now()/1000.0;
    let dt = now - this._lastSystemTimestamp;
    this._lastSystemTimestamp = now;
    this.runTime += dt;
    return dt;
  }
}
