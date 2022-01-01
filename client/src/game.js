import engine from 'engine';
import { CLIENT_STATES, CONTROL_TYPES } from './clientState';
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
      
      const collisionResult = self.collider.checkCollisionWithPickup(sg.pickups[pickupId]);
      //If player is actually close enough to pick it up
      if (collisionResult === 2) {
        sg.pickups[pickupId].collectedBy = self.id;
        self.score += sg.pickups[pickupId].worth;
        self.collider.updateBodyWithScore();
        sv.active.zoomOut(_state, GLOBALS.zoomAmountOnCollect);
        socket.playerCollectedPickup(_state, self.id, pickupId);
      } else if (collisionResult === 1) {
        const pickupAccelVec = self.pos.clone().add(self.moveHeading.clone().multiplyScalar(5)).subtract(sg.pickups[pickupId].pos).normalize().multiplyScalar(GLOBALS.pickupAccelSpeed);
        const pickupUpdateData = { accelTowards: self.id, accelX: pickupAccelVec.x, accelY: pickupAccelVec.y };
        sg.pickups[pickupId].setData(pickupUpdateData);
        socket.updatePickup(_state, pickupId, pickupUpdateData);
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
  const vpUnit = Math.min(s.viewport.vh, s.viewport.vw);
  c.fillStyle = "white";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);
  drawing.drawText(s, "Loading...", s.viewport.width / 2, s.viewport.height / 2, `${4*vpUnit}px Arial`, "rgba(100, 100, 100, 1.0)");
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
  } else if (keys.pressed('touches')) {
    s.input.style.display = 'none';
    sg.controlType = CONTROL_TYPES.TOUCH;
    while (!sg.playerNameValue || sg.playerNameValue?.length < 3) {
      const chosenName = prompt("Name your snek");
      sg.playerNameValue = chosenName;
      s.input.value = chosenName;
    }
    sg.clientState = CLIENT_STATES.START_SCREEN;
    s.input.style.display = 'initial';
  }
}

const updateStartScreen = (s) => {
  const sg = s.game;
  const sgb = sg.buttons;
  const c = s.ctx;
  const vpUnit = Math.min(s.viewport.vh, s.viewport.vw);
  c.fillStyle = "white";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);
  drawing.drawText(s, "Snakey Mouse", s.viewport.width / 2, s.viewport.height / 2 - 9*s.viewport.vw, `${5*vpUnit}px Arial`, "rgba(100, 100, 100, 1.0)");
  drawing.drawText(s, "Name Your Snek", s.viewport.width / 2, s.viewport.height / 2 - 4*s.viewport.vh, `${2*vpUnit}px Arial`, "rgba(50, 50, 50, 1.0)");
  if (sg.playerNameValue.length >= 3) {
    if (!sgb.joinGameButton) {
      sgb.joinGameButton = new CanvasButton(
        s.viewport.width / 2 - 10*s.viewport.vw, 
        s.viewport.height / 2 + 6*s.viewport.vh, 
        20*s.viewport.vw, 
        6*s.viewport.vh, 
        'rgb(100, 100, 100)', 
        'rgb(240, 100, 100)',
        () => {
          s.input.style.display = 'none';
          sg.clientState = CLIENT_STATES.CHARACTER_SELECT;
        }, 
        undefined, 
        'Join Game',
        `${3*s.viewport.vh}px Arial`,
        undefined,
        undefined,
        (_s, _button) => {
          const vpUnit = Math.min(_s.viewport.vh, _s.viewport.vw);
          _button.x = _s.viewport.width / 2 - 10*_s.viewport.vw;
          _button.y = _s.viewport.height / 2 + 6*_s.viewport.vh;
          _button.width = 20*_s.viewport.vw;
          _button.height = 6*_s.viewport.vh;
          _button.font = `${3*vpUnit}px Arial`;
        }
      );
    }
    sgb.joinGameButton.updateAndDraw(s);
  } else {
    drawing.drawText(s, "(3 character min, then press enter)", s.viewport.width / 2, s.viewport.height / 2 + 36, `${1.5*vpUnit}px Arial`, "rgba(160, 160, 160, 1.0)");
  }
}

const updateCharacterSelect = (s) => {
  const si = s.image;
  const sg = s.game;
  const sgb = sg.buttons;
  if (sgb.joinGameButton) {
    sgb.joinGameButton.destroy();
    sgb.joinGameButton = undefined;
  }
  const c = s.ctx;
  const vpUnit = Math.min(s.viewport.vh, s.viewport.vw);
  c.fillStyle = "white";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);
  drawing.drawText(
    s,
    "Choose Your Snek", 
    s.viewport.width / 2, 
    4*s.viewport.vh, 
    `${3*vpUnit}px Arial`,
    'rgb(50, 50, 50)'
  );
  const charSelectMargin = 3*vpUnit;
  if (!sgb.characterSelectButtons) {
    sgb.characterSelectButtons = [];
    const gridSize = s.viewport.width > s.viewport.height ? 6 : 4;
    for (let i=0; i<drawing.allPlayerSpriteNames.length; i++) {
      const buttonSize = ((s.viewport.width-charSelectMargin*2) / gridSize) - ((gridSize-1)*charSelectMargin)/gridSize;
      sgb.characterSelectButtons.push(new CanvasButton(
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
        si.sprites[`${drawing.allPlayerSpriteNames[i][0]}Head`],
        undefined,
        undefined,
        undefined,
        undefined,
        (_s, _button) => {
          const resizedButtonSize = ((_s.viewport.width-charSelectMargin*2) / gridSize) - ((gridSize-1)*charSelectMargin)/gridSize;
          _button.x = charSelectMargin+(i % gridSize) * (resizedButtonSize + charSelectMargin);
          _button.y = charSelectMargin*2+(Math.floor(i / gridSize)) * (resizedButtonSize + charSelectMargin);
          _button.width = resizedButtonSize;
          _button.height = resizedButtonSize;
        }
      ));
    }
  }
  sgb.characterSelectButtons.forEach((bt, i) => {
    bt.updateAndDraw(s);
    drawing.drawText(s, drawing.allPlayerSpriteNames[i][1], bt.x + bt.width / 2, bt.y + bt.height + 16, `${2*vpUnit}px Arial`, 'rgb(50, 50, 50)')
  });
}

const updateConnecting = (s) => {
  const sg = s.game;
  const sgb = sg.buttons;
  const c = s.ctx;
  const vpUnit = Math.min(s.viewport.vh, s.viewport.vw);
  if (sgb.characterSelectButtons) {
    for (let i=0; i<sgb.characterSelectButtons.length; i++) {
      sgb.characterSelectButtons[i].destroy();
      delete sgb.characterSelectButtons[i];
    }
    sgb.characterSelectButtons = undefined;
  }
  if (!sg.joinedGame && !sg.joiningGame) {
    //Tell the server to add a new player
    socket.createNewPlayer(s, sg.playerNameValue);
    sg.joiningGame = true;
  }
  c.fillStyle = "white";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);
  drawing.drawText(s, "Connecting...", s.viewport.width / 2, s.viewport.height / 2, `${6*vpUnit}px Arial`, "rgba(100, 100, 100, 1.0)");
}

const updatePaused = (s) => {
  const c = s.ctx;
  const vpUnit = Math.min(s.viewport.vh, s.viewport.vw);
  c.fillStyle = "rgba(0, 0, 0, 0.5)";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);
  drawing.drawText(s, "Paused", s.viewport.width / 2, s.viewport.height / 2, `${6*vpUnit}px Arial`, "rgba(200, 200, 200, 1.0)");
}
