import * as keys from '../keys';
import engine from 'engine';
const { utils } = engine;
let s, sg, sv, gu;

export const init = (_state) => {
  s = _state;
  sg = s.game;
  sv = s.view;
  gu = sg.gu;

  keys.keyDown("+", () => {
    sv.viewScale--;
    sv.active.rescaleGU();
  });

  keys.keyDown("-", () => {
    sv.viewScale++;
    sv.active.rescaleGU();
  });
};

export class View {
  constructor(_x, _y, _width, _height) {
    this.x = _x;
    this.y = _y;
    this.width = _width;
    this.height = _height;

    //How many game units fit along the largest axis of the view
    this.viewScale = 40;

    //Limits
    this.xLimitMin = 0;
    this.xLimitMax = sg.activeLevel?.guWidth ? sg.activeLevel.guWidth : 100;
    this.yLimitMin = 0;
    this.yLimitMax = sg.activeLevel?.guHeight ? sg.activeLevel.guHeight : 100;

    //Buffer
    this.xBuffer = 0.25;
    this.yBuffer = 0.25;
  }

  follow(center) {
    //Check each axis seperately
    //If the object has moved out of the bounds of the view, move
    if (center.x > this.xMaxBuffer()) {
      //Shift right
      //Lerp the value for some delay
      let lerpFollow = utils.lerp(0.2, this.xMax(), center.x + this.width * this.xBuffer);
      //Set the xMax for the view
      this.xMax(lerpFollow);
    } else if (center.x < this.xMinBuffer()) {
      //Shift left
      //Lerp the value for some delay
      let lerpFollow = utils.lerp(0.2, this.xMin(), center.x - this.width * this.xBuffer);
      //Set the xMin for the view
      this.xMin(lerpFollow);
    }

    if (center.y > this.yMaxBuffer()) {
      //Lerp the value for some delay
      let lerpFollow = utils.lerp(0.4, this.yMax(), center.y + this.height * this.yBuffer);
      //Set the yMax for the view
      this.yMax(lerpFollow);
    } else if (center.y < this.yMinBuffer()) {
      //Lerp the value for some delay
      let lerpFollow = utils.lerp(0.4, this.yMin(), center.y - this.height * this.yBuffer);
      //Set the yMin for the view
      this.yMin(lerpFollow);
    }
  }

  center(set) {
    if (set === undefined) {
      return {
        x: this.x + this.width / 2,
        y: this.x + this.height / 2
      };
    } else {
      this.xMin(set.x - this.width / 2);
      this.yMin(set.y - this.height / 2);
    }
  }

  xMin(set) {
    if (set === undefined) {
      return this.x;
    } else {
      this.x = utils.clamp(set, this.xLimitMin, this.xLimitMax);
    }
  }

  xMinBuffer() {
    return this.xMin() + this.width * this.xBuffer;
  }

  xMax(set) {
    if (set === undefined) {
      return this.x + this.width;
    } else {
      this.x = utils.clamp(set, this.xLimitMin, this.xLimitMax) - this.width;
    }
  }

  xMaxBuffer() {
    return this.xMax() - this.width * this.xBuffer;
  }

  yMin(set) {
    if (set === undefined) {
      return this.y;
    } else {
      this.y = utils.clamp(set, this.yLimitMin, this.yLimitMax);
    }
  }

  yMinBuffer() {
    return this.yMin() + this.height * this.yBuffer;
  }

  yMax(set) {
    if (set === undefined) {
      return this.y + this.height;
    } else {
      this.y = utils.clamp(set, this.yLimitMin, this.yLimitMax) - this.height;
    }
  }

  yMaxBuffer() {
    return this.yMax() - this.height * this.yBuffer;
  }

  setLimitsPixels(_xMin, _xMax, _yMin, _yMax) {
    this.xLimitMin = _xMin;
    this.xLimitMax = _xMax;
    this.yLimitMin = _yMin;
    this.yLimitMax = _yMax;
  }

  setLimitsGU(_xMinGU, _xMaxGU, _yMinGU, _yMaxGU) {
    this.setLimitsPixels(_xMinGU * sg.gu, _xMaxGU * sg.gu, _yMinGU * sg.gu, _yMaxGU * sg.gu);
  }

  getObjectRelativePosition(obj, multiplyByGU) {
    if (obj.pos === undefined) {
      return {
        x: obj.x * (multiplyByGU ? sg.gu : 1) - this.xMin(),
        y: obj.y * (multiplyByGU ? sg.gu : 1) - this.yMin()
      };
    } else {
      return {
        x: obj.pos.x * (multiplyByGU ? sg.gu : 1) - this.xMin(),
        y: obj.pos.y * (multiplyByGU ? sg.gu : 1) - this.yMin()
      }
    }
  }

  rescaleGU() {
    sg.gu = Math.round(Math.max(this.width, this.height) / sv.viewScale);
    //Re-define position limits for the view
    sv.active.setLimitsGU(
      0, 
      sg.activeLevel?.guWidth ? sg.activeLevel.guWidth : 100,
      0, 
      sg.activeLevel?.guHeight ? sg.activeLevel.guHeight : 100
    );
    //Make sure they didn't zoom out past the world border
    sv.active.xMin(sv.active.xMin());
    sv.active.xMax(sv.active.xMax());
    sv.active.yMin(sv.active.yMin());
    sv.active.yMax(sv.active.yMax());
  }
}
