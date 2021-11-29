import engine from 'engine';
import Victor from 'victor';
import * as keys from './keys';
import * as socket from './socket';
import { CLIENT_STATES } from './clientState';
const Vector = Victor;

let s, sp, spl, sg, sl;

export const init = (_state) => {
  s = _state;
  sp = s.physics;
  spl = s.player;
  sg = s.game;
  sl = s.level;

  keys.keyDown("a", "left", () => {
    if (!spl.moveLeft) {
      spl.moveHeading = new Vector(-1.0, 0.0);
      spl.shouldUpdateServer = true;
    }
  });

  keys.keyDown("d", "right", () => {
    if (!spl.moveRight) {
      spl.moveHeading = new Vector(1.0, 0.0);
      spl.shouldUpdateServer = true;
    }
  });

  keys.keyDown("w", "up", () => {
    if (!spl.moveUp) {
      spl.moveHeading = new Vector(0.0, -1.0);clientID
      spl.shouldUpdateServer = true;
    }
  });

  keys.keyDown("s", "down", () => {
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

  keys.keyUp("p", "esc", function() {
    if (sg.clientState === CLIENT_STATES.PLAYING) {
      sg.clientState = CLIENT_STATES.PAUSED;
    } else if (sg.clientState === CLIENT_STATES.PAUSED) {
      sg.clientState = CLIENT_STATES.PLAYING;
    }
  });
}

export const update = () => {
  const me = sg.players[sg.clientId];
  if (!me) return;
  me.moveHeading = spl.moveHeading;
  me.sprint = spl.sprint;
  if (spl.shouldUpdateServer) {
    socket.updateClientPlayer();
    spl.shouldUpdateServer = false;
  }
}
