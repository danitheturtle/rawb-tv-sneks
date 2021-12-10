import engine from 'engine';
import Victor from 'victor';
import * as keys from './keys';
import * as socket from './socket';
import { CLIENT_STATES } from './clientState';
const Vector = Victor;

let spl = {
  shouldUpdateServer: false,
  moveHeading: new Vector(1, 0),
  sprint: false
};
let clientState = CLIENT_STATES.PLAYING;
let usingKeyboard = false;
let zoomAmount = 0;

export const setListeners = () => {

  keys.keyDown("+", () => {
    zoomAmount++;
  });

  keys.keyDown("-", () => {
    zoomAmount--;
  });

  keys.keyDown("a", "left", () => {
    usingKeyboard = true;
    if (!spl.moveLeft) {
      spl.moveHeading = new Vector(-1.0, 0.0);
      spl.shouldUpdateServer = true;
    }
  });

  keys.keyDown("d", "right", () => {
    usingKeyboard = true;
    if (!spl.moveRight) {
      spl.moveHeading = new Vector(1.0, 0.0);
      spl.shouldUpdateServer = true;
    }
  });

  keys.keyDown("w", "up", () => {
    usingKeyboard = true;
    if (!spl.moveUp) {
      spl.moveHeading = new Vector(0.0, -1.0);
      spl.shouldUpdateServer = true;
    }
  });

  keys.keyDown("s", "down", () => {
    usingKeyboard = true;
    if (!spl.moveDown) {
      spl.moveHeading = new Vector(0.0, 1.0);
      spl.shouldUpdateServer = true;
    }
  });

  keys.keyDown("shift", "mouseButton", () => {
    if (!spl.sprint) {
      spl.sprint = true;
      spl.shouldUpdateServer = true;
    }
  });

  keys.keyUp("shift", "mouseButton", () => {
    if (spl.sprint) {
      spl.sprint = false;
      spl.shouldUpdateServer = true;
    }
  });

  keys.mouseMove((coords) => {
    usingKeyboard = false;
  });

  keys.keyUp("p", "esc", function() {
    if (clientState === CLIENT_STATES.PLAYING) {
      clientState = CLIENT_STATES.PAUSED;
    } else if (clientState === CLIENT_STATES.PAUSED) {
      clientState = CLIENT_STATES.PLAYING;
    }
  });

  keys.keyUp("del", () => {
    socket.reset();
  });
}

export const update = (s) => {
  let sg = s.game;
  let sv = s.view;

  const me = sg.players[sg.clientId];
  // console.log("cowd", spl.moveHeading, me.moveHeading);
  // if (!me) return;
  if (!usingKeyboard) {
    const playerPos = sv.active?.getObjectRelativePosition(s, me, true);
    const mouseCoords = keys.mouse();
    const mouseCoordsVec = new Vector(mouseCoords[0], mouseCoords[1]);
    const newMoveHeading = mouseCoordsVec.clone().subtract(playerPos);
    //to prevent jitter, make sure mouse dist is at least 2 GU away
    if (newMoveHeading.lengthSq() > 4*sg.gu*sg.gu) {
      spl.moveHeading = newMoveHeading.normalize();
      spl.shouldUpdateServer = true;
    }
  }
  me.moveHeading = spl.moveHeading;
  me.sprint = spl.sprint;
  if (spl.shouldUpdateServer) {
    spl.shouldUpdateServer = false;
    socket.updateClientPlayer(s);
  }

  if (zoomAmount > 0) {
    sv.active.zoomIn(s, zoomAmount);
  } else if (zoomAmount < 0) {
    sv.active.zoomOut(s, -zoomAmount);
  }
  zoomAmount = 0;
}
