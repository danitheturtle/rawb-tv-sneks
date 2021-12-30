import engine from 'engine';
import Victor from 'victor';
import * as keys from './keys';
import * as socket from './socket';
import { CanvasTouchTarget } from './drawing/canvasButton';
import { CONTROL_TYPES, CLIENT_STATES } from './clientState';
const Vector = Victor;

let controlType = CONTROL_TYPES.MOUSE;
let usingKeyboard = false;
let touchControlButtons = [];
export const addListeners = (_state) => {
  const s = _state;
  const sp = s.physics;
  const spl = s.player;
  const sg = s.game;
  const sl = s.level;
  const sv = s.view;

  keys.keyDown("a", "left", () => {
    sg.controlType = CONTROL_TYPES.KEYBOARD;
    if (!spl.moveLeft) {
      spl.moveHeading = new Vector(-1.0, 0.0);
      spl.shouldUpdateServer = true;
    }
  });

  keys.keyDown("d", "right", () => {
    sg.controlType = CONTROL_TYPES.KEYBOARD;
    if (!spl.moveRight) {
      spl.moveHeading = new Vector(1.0, 0.0);
      spl.shouldUpdateServer = true;
    }
  });

  keys.keyDown("w", "up", () => {
    sg.controlType = CONTROL_TYPES.KEYBOARD;
    if (!spl.moveUp) {
      spl.moveHeading = new Vector(0.0, -1.0);
      spl.shouldUpdateServer = true;
    }
  });

  keys.keyDown("s", "down", () => {
    sg.controlType = CONTROL_TYPES.KEYBOARD;
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
  
  keys.keyDown("touches", (touchEvent) => {
    sg.controlType = CONTROL_TYPES.TOUCH;
    sg.touchButtons.forEach(btn => btn.handleTouchStart(s, touchEvent));
  });
  
  keys.keyUp("touches", (touchEvent) => {
    sg.touchButtons.forEach(btn => btn.handleTouchEnd(touchEvent));
  });
  
  keys.mouseMove((coords) => {
    sg.controlType = CONTROL_TYPES.MOUSE;
  });

  keys.keyUp("p", "esc", function() {
    if (sg.clientState === CLIENT_STATES.PLAYING) {
      sg.clientState = CLIENT_STATES.PAUSED;
    } else if (sg.clientState === CLIENT_STATES.PAUSED) {
      sg.clientState = CLIENT_STATES.PLAYING;
    }
  });
}

export const update = (_state) => {
  const s = _state;
  const sg = s.game;
  const sv = s.view;
  const me = sg.players[sg.clientId];
  const spl = s.player;
  const si = s.image;
  if (!me) return;
  if (sg.controlType === CONTROL_TYPES.MOUSE) {
    const playerPos = sv.active?.getObjectRelativePosition(s, me, true);
    const mouseCoords = keys.mouse();
    const mouseCoordsVec = new Vector(mouseCoords[0], mouseCoords[1]);
    const newMoveHeading = mouseCoordsVec.clone().subtract(playerPos);
    //to prevent jitter, make sure mouse dist is at least 2 GU away
    if (newMoveHeading.lengthSq() > 4*sg.gu*sg.gu) {
      spl.moveHeading = newMoveHeading.normalize();
      spl.shouldUpdateServer = true;
    }
  } else if (sg.controlType === CONTROL_TYPES.TOUCH) {
    if (sg.touchButtons.length < 1) {
      sg.touchButtons.push(
        new CanvasTouchTarget(
          -128,-128, 96, 96, 
          undefined, si.sprites[`sprintTouchIcon`], 
          () => { 
            if (!spl.sprint) {
              spl.sprint = true;
              spl.shouldUpdateServer = true;
            }
          }, 
          () => {
            if (spl.sprint) {
              spl.sprint = false;
              spl.shouldUpdateServer = true;
            }
          }
        )
      );
      sg.touchButtons.push(
        new CanvasTouchTarget(
          128, -256, 128, 128, 
          'white', undefined, 
          undefined, 
          undefined,
          (e) => {
            const newMoveHeading = new Vector(e.clientX, e.clientY).subtract(new Vector(192, s.viewport.height - 192));
            spl.moveHeading = newMoveHeading.normalize();
            spl.shouldUpdateServer = true;
          }
        )
      );
    }
    // sg.touchButtons.forEach(touchButton => touchButton.updateAndDraw(s))
  }
  me.moveHeading = spl.moveHeading;
  me.sprint = spl.sprint;
  if (spl.shouldUpdateServer) {
    socket.updateClientPlayer(s);
    spl.shouldUpdateServer = false;
  }
}
