import engine from 'engine';
import { CLIENT_STATES } from './clientState';
import * as drawing from './drawing';
import * as keys from './keys';
import * as socket from './socket';
import * as playerController from './playerController';
import { CanvasButton } from './drawing/canvasButton';
const { GLOBALS, PICKUP_WORTHS } = engine;

let joinGameButton;
let characterSelectButtons;

export const start = (s) => {
  let sg = s.game;
  sg.clientState = CLIENT_STATES.LOADING;
  Promise.all(sg.loading).then(() => {
    //Set the state to display the start screen
    sg.clientState = CLIENT_STATES.TUTORIAL_SCREEN;
  });
  s.resize();
  s.input.style.display = 'none';
  s.input.addEventListener('change', (e) => {
    sg.playerNameValue = e.target.value;
  });
  update(s);
}

export const update = (s) => {
  // console.log(s);
  let sg = s.game;
  let sv = s.view;
  let si = s.image;
  // loop to top after sleep
  sg.animationID = requestAnimationFrame(() => {
    delete sg.players[undefined];
    update(s)
  });

  let dt = s.updateTimeFromSystem();

  //Switch based on client state
  switch (sg.clientState) {
    //If assets are still loading
    case CLIENT_STATES.LOADING:
      //Show the loading screen
      {
        let c = s.ctx;
        c.fillStyle = "white";
        c.fillRect(0, 0, s.viewport.width, s.viewport.height);
        drawing.drawText(s, s, "Loading...", s.viewport.width / 2, s.viewport.height / 2, "48px Arial", "rgba(100, 100, 100, 1.0)");
      }
      return;
    //If viewing tutorial
    case CLIENT_STATES.TUTORIAL_SCREEN:
      //Display tutorial
      {
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
          s.input.style.display = 'initial';
          s.input.focus();
          sg.clientState = CLIENT_STATES.START_SCREEN;
        }
      }
      return;
    //If on the start screen
    case CLIENT_STATES.START_SCREEN:
      //Show start screen
      {
        let c = s.ctx;
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
      return;
    //if selecting character
    case CLIENT_STATES.CHARACTER_SELECT:
      //update character select
      {
        let c = s.ctx;
        c.fillStyle = "white";
        c.fillRect(0, 0, s.viewport.width, s.viewport.height);
        drawing.drawText(s,
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
      return;
    //If connecting
    case CLIENT_STATES.CONNECTING:
      //Show connecting screen
      {
        if (!sg.joinedGame && !sg.joiningGame) {
          //Tell the server to add a new player
          socket.createNewPlayer(s, sg.playerNameValue);
          sg.joiningGame = true;
        }
        const c = s.ctx;
        c.fillStyle = "white";
        c.fillRect(0, 0, s.viewport.width, s.viewport.height);
        drawing.drawText(s, "Connecting...", s.viewport.width / 2, s.viewport.height / 2, "60px Arial", "rgba(100, 100, 100, 1.0)");
      }
      return;
    //The default. Update as normal
    case CLIENT_STATES.PLAYING:
    default:
      break;
  }

  playerController.update(s);

  for (const p in sg.players) {
    const player = sg.players[p];
    // console.log("defv", player.pos);
    player.update(s, dt);
    // const relativePos = sv.active?.getObjectRelativePosition(s, player, true);
  }

  //Check for pickups
  const self = sg.players[sg.clientId];
  if (self && !self.dead) {
    //Detect pickups
    for (const pickupId in sg.pickups) {
      if (self.checkCollisionWithPickup(sg.pickups[pickupId])) {

        self.score += PICKUP_WORTHS[sg.pickups[pickupId].pickupType];
        self.updateBodyWithScore();

        sg.pickupsTotal--;
        delete sg.pickups[pickupId];

        sv.active.zoomOut(s, GLOBALS.zoomAmountOnCollect);
        socket.playerCollectedPickup(s, self.id, pickupId);
      }
    }

    if (sv.active !== undefined) {
      sv.active.follow(self.pos.clone().multiplyScalar(sg.gu));
    }
  }


  let c = s.ctx;
  //Re-draw the background
  c.fillStyle = "white";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);

  drawing.draw(s);
  drawing.drawGUI(s);

  if (sg.clientState === CLIENT_STATES.PAUSED) {//update paused
    c.fillStyle = "rgba(0, 0, 0, 0.5)";
    c.fillRect(0, 0, s.viewport.width, s.viewport.height);
    drawing.drawText(s, "Paused", s.viewport.width / 2, s.viewport.height / 2, "60px Arial", "rgba(200, 200, 200, 1.0)");
  }

}
