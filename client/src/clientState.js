import engine from 'engine';
import Victor from 'victor';
import { getViewport } from './clientUtils';
import assets from './assets';
const Vector = Victor;
const { State, GAME_STATES } = engine;

export const CLIENT_STATES = {
  LOADING: 'LOADING',
  TUTORIAL_SCREEN: 'TUTORIAL_SCREEN',
  START_SCREEN: 'START_SCREEN',
  CONNECTING: 'CONNECTING',
  PLAYING: 'PLAYING',
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
      clientId: undefined,
      //Is the player connecting to a socket
      connecting: false,
      //Has the player joined the game
      joinedGame: false,
      //array of promises for asset loading progress bar
      loading: [],
      //How many total assets are loading at runtime?
      numAssetsLoading: 0
    };
    
    this.player = {
      shouldUpdateServer: false,
      moveHeading: new Vector(1, 0),
      sprint: false
    };
    
    this.audio = {
      audioCtx: undefined,
      soundNames: [
        "backgroundMusic.mp3"
      ],
      sounds: {}
    };
    
    this.image = {
      raw: assets,
      tilesheetAssets: {
        coreTilesheet: assets.images.coreTilesheet
      },
      spritesheetAssets: {
        p1Spritesheet: assets.images.p1Spritesheet
      },
      backgroundAssets: {
        defaultBackground: assets.images.defaultBackground,
        dangerBackground: assets.images.dangerBackground,
        radicalBackground: assets.images.radicalBackground
      },
      tutorialImg: assets.images.tutorialBackground,
      tilesheets: {},
      spritesheets: {},
      sprites: {},
      backgrounds: {}
    };
    
    this.level = {
      ...this.level,
      activeBackground: undefined
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
    
    if (this.view?.active) {
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
