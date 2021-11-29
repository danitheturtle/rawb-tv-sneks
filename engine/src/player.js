import Victor from 'victor';
import * as physics from './physics';
import * as time from './time';
import { GameObject } from './physicsObjects';
import { randomVec } from './utils';
import { GLOBALS } from './state';
const Vector = Victor;

export class Player extends GameObject {
  constructor(_gameStateRef, _clientId, _pos, _vel, _accel, _collider, _renderer) {
    super(_gameStateRef, _pos, _vel, _accel, _collider, _renderer)
    //Store their ID
    this.clientId = _clientId;

    //Player input tracking.  Everything is false/blank by default
    this.moveHeading = randomVec();
    this.sprint = false;
    
    //custom spritesheet support for meme potential
    this.customSpritesheetURL = null;
  }

  update() {
    //accelerate towards moveHeading, clamp speed
    this.accel = this.moveHeading.clone().multiplyScalar(this.gameStateRef.physics.accelSpeed);
    super.update();
  }
  
  setCustomSpritesheet(spritesheetURL) {
    this.customSpritesheetURL = spritesheetURL
  }
  
  getData() {
    return {
      ...super.getData(),
      clientId: this.clientId,
      time: this.gameStateRef.time.clientTimers[this.clientId],
      moveHeadingX: this.moveHeading.x,
      moveHeadingY: this.moveHeading.y,
      sprint: this.sprint,
      customSpritesheetURL: this.customSpritesheetURL
    };
  }

  setData(data) {
    super.setData(data, this.gameStateRef.time.clientTimers[data.clientId] - data.time);
    this.clientId = data.clientId;
    this.moveHeading = new Vector(data.moveHeadingX, data.moveHeadingY),
    this.sprint = data.sprint;
    this.customSpritesheetURL = data.customSpritesheetURL;
    this.gameStateRef.time.clientTimers[data.clientId] = data.time;
  }
  
  setClientData(data) {
    this.gameStateRef.time.clientTimers[data.clientId] = data.time;
  }
}
