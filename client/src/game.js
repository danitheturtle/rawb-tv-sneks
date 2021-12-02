import engine from 'engine';
import { CLIENT_STATES } from './clientState';
import * as drawing from './drawing';
import * as keys from './keys';
import * as socket from './socket';
import * as playerController from './playerController';
const { time, physics } = engine;

let s, sg, sv, si, sp;

export const init = (_state) => {
  s = _state;
  sg = s.game;
  sv = s.view;
  si = s.image;
  sp = s.physics;
  sg.clientState = CLIENT_STATES.LOADING;
}

export const start = () => {
  Promise.all(sg.loading).then(() => {
    //Set the state to display the start screen
    sg.clientState = CLIENT_STATES.TUTORIAL_SCREEN;
  });
  s.resize();
  update();
}

export const update = () => {
  //Start the animation loop
  sg.animationID = requestAnimationFrame(update);
  //Switch based on client state
  switch (sg.clientState) {
    //If assets are still loading
    case CLIENT_STATES.LOADING:
      //Show the loading screen
      updateLoading();
      return;
      //If viewing tutorial
    case CLIENT_STATES.TUTORIAL_SCREEN:
      //Display tutorial
      updateTutorial();
      return;
      //If on the start screen
    case CLIENT_STATES.START_SCREEN:
      //Show start screen
      updateStartScreen();
      return;
      //If connecting
    case CLIENT_STATES.CONNECTING:
      //Show connecting screen
      updateConnecting();
      return;
      //The default.  Update as normal
    case CLIENT_STATES.PLAYING:
      break;
  }
  
  //Game is currently playing and all player setup is now finished
  time.update();
  physics.update();
  playerController.update();

  //Store the drawing context shorthand
  let c = s.ctx;
  //Re-draw the background
  c.fillStyle = "white";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);
  
  for (const p in s.players) {
    const player = sg.players[p];
    player.update();
    const relativePos = sv.active?.getObjectRelativePosition(player, true);
  }
  
  if (sg.players[sg.clientId] !== undefined && sv.active !== undefined) {
    sv.active.follow(sg.players[sg.clientId].collider.center.clone().multiplyScalar(sg.gu));
  }
  
  drawing.draw();
  drawing.drawGUI();
  
  if (sg.clientState === CLIENT_STATES.PAUSED) {
    updatePaused();
  }
}

const updateLoading = () => {
  let c = s.ctx;
  c.fillStyle = "white";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);
  drawing.drawText("Loading...", s.viewport.width / 2, s.viewport.height / 2, "48px Arial", "rgba(100, 100, 100, 1.0)");
}

const updateTutorial = () => {
  let c = s.ctx;
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
    sg.clientState = CLIENT_STATES.START_SCREEN;
  }
}

const updateStartScreen = () => {
  let c = s.ctx;
  c.fillStyle = "white";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);
  drawing.drawText("Snakey Mouse", s.viewport.width / 2, s.viewport.height / 3, "60px Arial", "rgba(100, 100, 100, 1.0)");

  c.fillStyle = "rgb(240, 100, 100)";
  c.strokeStyle = "rgb(100, 100, 100)";

  //TODO: make a canvas button class
  let buttonX = s.viewport.width / 2 - 200;
  let buttonY = s.viewport.height / 2 - 30;
  let buttonWidth = 400;
  let buttonHeight = 60;

  let mouse = keys.mouse();

  if (mouse[0] > buttonX && mouse[0] < buttonX + buttonWidth && mouse[1] > buttonY && mouse[1] < buttonY + buttonHeight) {
    c.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    drawing.drawText("Join Game", s.viewport.width / 2, s.viewport.height / 2, "30px Arial", "rgba(250, 250, 250, 1.0)");
    if (keys.pressed('mouseButton')) {
      sg.clientState = CLIENT_STATES.CONNECTING;
    }
  } else {
    c.strokeRect(buttonX, buttonY, buttonWidth, buttonHeight);
    drawing.drawText("Join Game", s.viewport.width / 2, s.viewport.height / 2, "30px Arial", "rgba(140, 140, 140, 1.0)");
  }
}

const updateConnecting = () => {
  if (!sg.joinedGame && !sg.joiningGame) {
    //Tell the server to add a new player
    socket.createNewPlayer();
    sg.joiningGame = true;
  }
  const c = s.ctx;
  c.fillStyle = "white";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);
  drawing.drawText("Connecting...", s.viewport.width / 2, s.viewport.height / 2, "60px Arial", "rgba(100, 100, 100, 1.0)");
}

const updatePaused = () => {
  let c = s.ctx;
  c.fillStyle = "rgba(0, 0, 0, 0.5)";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);
  drawing.drawText("Paused", s.viewport.width / 2, s.viewport.height / 2, "60px Arial", "rgba(200, 200, 200, 1.0)");
}
