import engine from 'engine';
import { getViewport } from './clientUtils';
const { State, GAME_STATES } = engine;

export const CLIENT_STATES = {
  LOADING: 1000,
  TUTORIAL_SCREEN: 1001,
  START_SCREEN: 1002,
  CONNECTING: 1003,
  PLAYING: 1004,
  ...GAME_STATES
};

export class ClientState extends State {
  constructor(_io) {
    super(_io);
    //Game state
    this.game = {
      ...this.game,
      //Game Unit.  32 pixels
      gu: 32,
      //ID of the animation being used
      animationID: 0,
      //Client state.  LOADING by default
      clientState: CLIENT_STATES.LOADING,
      //Player ID of the client
      clientID: undefined,
      //Is the player joining a game
      connecting: false,
      //array of promises for asset loading progress bar
      loading: []
    };
    
    this.player = {
      shouldUpdateServer: false,
      moveLeft: false,
      moveRight: false,
      dropDown: false,
      sprint: false,
      shouldJump: false
    };
    
    this.audio = {
      audioCtx: undefined,
      soundNames: [
        "backgroundMusic.mp3"
      ],
      sounds: {}
    };
    
    this.image = {
      tilesheetNames: [
        "core_spritesheet"
      ],
      spritesheetNames: [
        "p1_spritesheet", "p2_spritesheet"
      ],
      backgroundNames: ["bg_grasslands.png"],
      tutorialImg: undefined,
      tilesheets: {},
      spritesheets: {},
      sprites: {},
      backgrounds: {}
    };
    
    this.view = {
      active: undefined,
      viewScale: 50
    };
    //Non-nested vars
    this.viewport = getViewport();
    this.canvas = null;
    this.ctx = null;
  }
  
  setCanvas(_canvas) {
    this.canvas = _canvas;
  }
  
  resize() {
    if (!this.canvas) return;
    this.viewport = getViewport();
    if (this.view.active) {
      this.view.active.width = this.viewport.width;
      this.view.active.height = this.viewport.height;
      //Re-scale game units based on the active view
      this.view.active?.rescaleGU();
    }
    //Resize the canvas to be 100vwX100vh
    this.canvas.setAttribute("width", this.viewport.width);
    this.canvas.setAttribute("height", this.viewport.height);
    //Replace the old context with the newer, resized version
    this.ctx = this.canvas.getContext('2d');
  }
}
