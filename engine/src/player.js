import Victor from 'victor';
import * as physics from './physics';
import { GameObject } from './physicsObjects';
const Vector = Victor;

export class Player extends GameObject {
  constructor(_gameStateRef, _clientId, _pos, _vel, _accel, _collider, _renderer) {
    super(_gameStateRef, _pos, _vel, _accel, _collider, _renderer)
    //Store their ID
    this.clientId = _clientId;

    //Player input tracking.  Everything is false by default
    this.moveLeft = false;
    this.moveRight = false;
    this.sprint = false;
    
    //custom spritesheet support for meme potential
    this.customSpritesheetURL = null;
  }

  update() {
    super.update();
    const sp = this.gameStateRef.physics;
    //Set the hor velocity to zero
    this.vel.x = 0;
    //If moving left, move left
    if (this.moveLeft) {
      this.vel.add(new Vector(this.sprint ?
        sp.moveSpeed * sp.sprintMult :
        sp.moveSpeed, 0.0));
    }
    //If moving right, move right
    if (this.moveRight) {
      this.vel.add(new Vector(this.sprint ?
        sp.moveSpeed * sp.sprintMult :
        sp.moveSpeed, 0.0));
    }
  }
  
  setCustomSpritesheet(spritesheetURL) {
    this.customSpritesheetURL = spritesheetURL
  }
  
  getData() {
    return {
      ...super.getData(),
      clientId: this.clientId,
      time: this.gameStateRef.time.clientTimers[this.clientId],
      moveLeft: this.moveLeft,
      moveRight: this.moveRight,
      sprint: this.sprint,
      customSpritesheetURL: this.customSpritesheetURL
    };
  }

  setData(data) {
    super.setData(data, this.gameStateRef.time.clientTimers[data.clientId] - data.time);
    this.clientId = data.clientId;
    this.moveLeft = data.moveLeft;
    this.moveRight = data.moveRight;
    this.sprint = data.sprint;
    this.customSpritesheetURL = data.customSpritesheetURL;
    this.gameStateRef.time.clientTimers[data.clientId] = data.time;
  }
  
  setClientData(data) {
    this.gameStateRef.time.clientTimers[data.clientId] = data.time;
  }
}
