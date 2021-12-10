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
  CHARACTER_SELECT: 'CHARACTER_SELECT',
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
      //Is the player joining
      joiningGame: false,
      //array of promises for asset loading progress bar
      loading: [],
      //How many total assets are loading at runtime?
      numAssetsLoading: 0,
      playerNameValue: "",
      playerSpriteValue: "",

      scoreboard: []
    };


    this.serverTime = 0;

    this.audio = {
      audioCtx: undefined,
      soundNames: [
        "backgroundMusic.mp3"
      ],
      sounds: {}
    };

    this.image = {
      raw: assets,
      tilesheetAssets: {},
      spritesheetAssets: Object.entries(assets.images)
        .filter(([key]) => key.includes('Spritesheet'))
        .reduce((acc, [spKey, spVal]) => {
          acc[spKey] = spVal;
          return acc;
        }, {}),
      backgroundAssets: Object.entries(assets.images)
        .filter(([key]) => key.includes('Background'))
        .reduce((acc, [spKey, spVal]) => {
          acc[spKey] = spVal;
          return acc;
        }, {}),
      tutorialImg: assets.images.tutorialImg,
      tilesheets: {},
      spritesheets: {},
      sprites: {},
      backgrounds: {}
    };

    this.view = {
      active: undefined
    };
    //Non-nested vars
    this.activeBackgrounds = [];
    this.viewport = getViewport();
    this.canvas = null;
    this.ctx = null;
  }

  setCanvas(_canvas) {
    this.canvas = _canvas;
  }

  setInput(_input) {
    this.input = _input;
  }

  resize() {
    if (!this.canvas) return;
    this.viewport = getViewport();

    if (this.view?.active) {
      this.view.active.width = this.viewport.width;
      this.view.active.height = this.viewport.height;
      //Re-scale game units based on the active view
      this.view.active?.rescaleGU(this);
    }
    //Resize the canvas to be 100vwX100vh
    this.canvas.setAttribute("width", this.viewport.width);
    this.canvas.setAttribute("height", this.viewport.height);
    //Replace the old context with the newer, resized version
    this.ctx = this.canvas.getContext('2d');
  }
}
