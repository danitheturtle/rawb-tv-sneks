import engine from 'engine';
import { CLIENT_STATES } from './clientState';
import * as drawing from './drawing';
import * as keys from './keys';
import * as socket from './socket';
import * as playerController from './playerController';
import { CanvasButton } from './drawing/canvasButton';
const { time, physics, GLOBALS } = engine;

export const init = (_state) => {
  _state.game.clientState = CLIENT_STATES.LOADING;
}

export const start = (_state) => {
  const s = _state;
  const sg = s.game;
  Promise.all(sg.loading).then(() => {
    //Set the state to display the start screen
    sg.clientState = CLIENT_STATES.TUTORIAL_SCREEN;
  });
  s.resize();
  s.input.style.display = 'none';
  s.input.addEventListener('change', (e) => {
    sg.playerNameValue = e.target.value;
  });
  update(_state);
}

export const update = (_state) => {
  const sg = _state.game;
  const sv = _state.view;
  //Start the animation loop
  sg.animationID = requestAnimationFrame(() => update(_state));
  //Switch based on client state
  switch (sg.clientState) {
    //If assets are still loading
    case CLIENT_STATES.LOADING:
      //Show the loading screen
      updateLoading(_state);
      return;
    //If viewing tutorial
    case CLIENT_STATES.TUTORIAL_SCREEN:
      //Display tutorial
      updateTutorial(_state);
      return;
    //If on the start screen
    case CLIENT_STATES.START_SCREEN:
      //Show start screen
      updateStartScreen(_state);
      return;
    //if selecting character
    case CLIENT_STATES.CHARACTER_SELECT:
      //update character select
      updateCharacterSelect(_state);
      return;
    //If connecting
    case CLIENT_STATES.CONNECTING:
      //Show connecting screen
      updateConnecting(_state);
      return;
    //The default. Update as normal
    case CLIENT_STATES.PLAYING:
    default:
      break;
  }
  
  //Game is currently playing and all player setup is now finished
  time.update(_state);
  physics.update(_state);
  playerController.update(_state);
  
  //Check for pickups
  
  //Store the drawing context shorthand
  let c = _state.ctx;
  //Re-draw the background
  c.fillStyle = "white";
  c.fillRect(0, 0, _state.viewport.width, _state.viewport.height);
  
  for (const p in _state.players) {
    const player = sg.players[p];
    player.update(_state);
    const relativePos = sv.active?.getObjectRelativePosition(_state, player, true);
  }
  
  //Check for pickups
  const self = sg.players[sg.clientId];
  if (self && !self.dead) {
    //Detect pickups
    const pickupsCollected = [];
    for (const pickupId in sg.pickups) {
      if (sg.pickups[pickupId].collectedBy !== undefined) continue;
      if (self.collider.checkCollisionWithPickup(sg.pickups[pickupId])) {
        sg.pickups[pickupId].collectedBy = self.id;
        self.score += sg.pickups[pickupId].worth;
        self.collider.updateBodyWithScore();
        sv.active.zoomOut(_state, GLOBALS.zoomAmountOnCollect);
        socket.playerCollectedPickup(_state, self.id, pickupId);
      }
    }
  }
  
  if (sg.players[sg.clientId] !== undefined && sv.active !== undefined) {
    sv.active.follow(sg.players[sg.clientId].collider.center.clone().multiplyScalar(sg.gu));
  }
  
  drawing.draw(_state);
  drawing.drawGUI(_state);
  
  if (sg.clientState === CLIENT_STATES.PAUSED) {
    updatePaused(_state);
  }
}

const updateLoading = (s) => {
  const c = s.ctx;
  c.fillStyle = "white";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);
  drawing.drawText(s, "Loading...", s.viewport.width / 2, s.viewport.height / 2, "48px Arial", "rgba(100, 100, 100, 1.0)");
}

const updateTutorial = (s) => {
  const si = s.image;
  const sg = s.game;
  const c = s.ctx;
  c.fillStyle = "white";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);

  //Get the tutorial image
  let img = si.tutorialImg;
  //Get the width/height of the tutorial image
  let dWidth = img.width;
  let dHeight = img.height;

  //If the image is wider/taller than the screen, scale it down
  if (img.width > s.viewport.width || img.height > s.viewport.height) {
    dWidth = s.viewport.width > s.viewport.height ?
      s.viewport.height :
      s.viewport.width;
    dHeight = dWidth;
  }
  //Center the image
  let dx = (s.viewport.width / 2) - (dWidth / 2);
  let dy = (s.viewport.height / 2) - (dHeight / 2);
  //Draw the image
  c.drawImage(img.image, dx, dy, dWidth, dHeight);

  //If the user clicks, go to the start screen
  if (keys.pressed('mouseButton')) {
    s.input.style.display = 'initial';
    s.input.focus();
    sg.clientState = CLIENT_STATES.START_SCREEN;
  }
}

let joinGameButton;
const updateStartScreen = (s) => {
  const sg = s.game;
  const c = s.ctx;
  c.fillStyle = "white";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);
  drawing.drawText(s, "Snakey Mouse", s.viewport.width / 2, s.viewport.height / 2 - 160, "60px Arial", "rgba(100, 100, 100, 1.0)");
  drawing.drawText(s, "Name Your Snek", s.viewport.width / 2, s.viewport.height / 2 - 40, "24px Arial", "rgba(50, 50, 50, 1.0)");
  if (sg.playerNameValue.length >= 3) {
    if (!joinGameButton) {
      joinGameButton = new CanvasButton(
        s.viewport.width / 2 - 200, 
        s.viewport.height / 2 + 60, 
        400, 
        60, 
        'rgb(100, 100, 100)', 
        'rgb(240, 100, 100)',
        () => {
          s.input.style.display = 'none';
          sg.clientState = CLIENT_STATES.CHARACTER_SELECT;
        }, 
        undefined, 
        'Join Game'
      );
    }
    joinGameButton.updateAndDraw(s);
  } else {
    drawing.drawText(s, "(3 character min, then press enter)", s.viewport.width / 2, s.viewport.height / 2 + 36, "12px Arial", "rgba(160, 160, 160, 1.0)");
  }
}

let characterSelectButtons;
const updateCharacterSelect = (s) => {
  if (joinGameButton) {
    joinGameButton.destroy();
    joinGameButton = undefined;
  }
  const si = s.image;
  const sg = s.game;
  const c = s.ctx;
  c.fillStyle = "white";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);
  drawing.drawText(
    s,
    "Choose Your Snek", 
    s.viewport.width / 2, 
    48, 
    "36px Arial",
    'rgb(50, 50, 50)'
  );
  const charSelectMargin = 50;
  if (!characterSelectButtons) {
    characterSelectButtons = [];
    const gridSize = 7;
    for (let i=0; i<drawing.allPlayerSpriteNames.length; i++) {
      const buttonSize = ((s.viewport.width-charSelectMargin*2) / gridSize) - ((gridSize-1)*charSelectMargin)/gridSize;
      characterSelectButtons.push(new CanvasButton(
        charSelectMargin+(i % gridSize) * (buttonSize + charSelectMargin),
        charSelectMargin*2+(Math.floor(i / gridSize)) * (buttonSize + charSelectMargin),
        buttonSize,
        buttonSize,
        'rgb(255, 255, 255)', 
        'rgb(200, 200, 200)', 
        () => {
          sg.playerSpriteValue = drawing.allPlayerSpriteNames[i][0];
          sg.clientState = CLIENT_STATES.CONNECTING;
        },
        si.sprites[`${drawing.allPlayerSpriteNames[i][0]}Head`]
      ))
    }
  }
  characterSelectButtons.forEach((bt, i) => {
    bt.updateAndDraw(s);
    drawing.drawText(s, drawing.allPlayerSpriteNames[i][1], bt.x + bt.width / 2, bt.y + bt.height + 16, "20px Arial", 'rgb(50, 50, 50)')
  });
}

const updateConnecting = (s) => {
  if (characterSelectButtons) {
    for (let i=0; i<characterSelectButtons.length; i++) {
      characterSelectButtons[i].destroy();
      delete characterSelectButtons[i];
    }
    characterSelectButtons = undefined;
  }
  const sg = s.game;
  const c = s.ctx;
  if (!sg.joinedGame && !sg.joiningGame) {
    //Tell the server to add a new player
    socket.createNewPlayer(s, sg.playerNameValue);
    sg.joiningGame = true;
  }
  c.fillStyle = "white";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);
  drawing.drawText(s, "Connecting...", s.viewport.width / 2, s.viewport.height / 2, "60px Arial", "rgba(100, 100, 100, 1.0)");
}

const updatePaused = (s) => {
  const c = s.ctx;
  c.fillStyle = "rgba(0, 0, 0, 0.5)";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);
  drawing.drawText(s, "Paused", s.viewport.width / 2, s.viewport.height / 2, "60px Arial", "rgba(200, 200, 200, 1.0)");
}
