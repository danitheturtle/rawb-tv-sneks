import Victor from 'victor';
import * as time from './time';
import physics, { GameObject, CircleCollider } from './physics';
import { randomVec, randomInt, norm, lerp, clamp } from './utils';
import { GLOBALS } from './state';
const Vector = Victor;

export class Player extends GameObject {
  constructor() {
    super();
    //Did the player recently die?
    this.dead = false;
    this.invincibleTimer = 0;

    //Player input tracking.  Everything is false/blank by default
    this.moveHeading = randomVec();
    this.sprint = false;
    this.sprintTimer = 0;

    //snake data
    this.bodySpacing = 1.8;
    
    //Player sprite
    this.spriteName = undefined;
    
    //Score
    this.score = 0;
  }

  update(_state) {
    if (!this.dead) {
      //Rotate towards heading, clamp degrees so you can't turn around on the spot
      this.accel = this.vel.clone().normalize();
      const angleDiff = (180+this.moveHeading.angleDeg()) - (180+this.accel.angleDeg());
      const angleDir = angleDiff > 0 ? 1 : -1;
      const clampedDegToRotate = clamp(Math.abs(angleDiff), 0, 90)*(Math.abs(angleDiff) > 180 ? -angleDir : angleDir);
      this.accel.rotateDeg(clampedDegToRotate).multiplyScalar(GLOBALS.baseAccelSpeed);
      //Add acceleration to the velocity scaled by dt.  Limit the velocity so collisions don't break
      this.vel.add(this.accel.multiplyScalar(time.dt(_state)));
      //limit velocity with current max speed (squared since its cheaper)
      const currentMaxSpeed = this.sprint ? 
        GLOBALS.sprintMult * GLOBALS.sprintMult * GLOBALS.baseMoveSpeed * GLOBALS.baseMoveSpeed : 
        GLOBALS.baseMoveSpeed * GLOBALS.baseMoveSpeed;
      if (this.vel.lengthSq() > currentMaxSpeed) {
        this.vel.normalize().multiplyScalar(this.sprint ? GLOBALS.baseMoveSpeed * GLOBALS.sprintMult : GLOBALS.baseMoveSpeed);
      }
      //Add velocity to the position scaled by dt
      this.pos.add(this.vel.clone().multiplyScalar(time.dt(_state)));
      
      //Sprint decreases snake length. If snake is too short, stop sprinting
      if (this.sprint) {
        if (this.sprintTimer % 30 === 0 && this.score > 0) {
          this.score = Math.max(0, this.score - GLOBALS.sprintCostPerSecond/2);
          this.collider.updateBodyWithScore();
        }
        this.sprintTimer = (this.sprintTimer + 1) % 30;
      } else {
        this.sprintTimer = 0;
      }
      //Reset acceleration
      this.accel = new Vector(0.0, 0.0);
      this.collider?.update();
    }
  }
  
  isOutOfBounds(_state) {
    return this.collider.isOutOfBounds(_state);
  }

  getData() {
    return {
      ...super.getData(),
      dead: this.dead,
      name: this.name,
      moveHeadingX: this.moveHeading.x,
      moveHeadingY: this.moveHeading.y,
      sprint: this.sprint,
      sprintTimer: this.sprintTimer,
      spriteName: this.spriteName,
      score: this.score
    };
  }
  
  getServerData() {
    return this.getData();
  }
  
  getServerUpdateData() {
    return {
      ...super.getServerUpdateData(),
      dead: this.dead,
      moveHeadingX: this.moveHeading.x,
      moveHeadingY: this.moveHeading.y,
      sprint: this.sprint,
      score: this.score,
      spriteName: this.spriteName,
      name: this.name,
      sprintTimer: this.sprintTimer
    };
  }
  
  getClientUpdateData() {
    return {
      ...super.getClientUpdateData(),
      moveHeadingX: this.moveHeading.x,
      moveHeadingY: this.moveHeading.y,
      sprint: this.sprint,
      spriteName: this.spriteName,
      name: this.name,
      sprintTimer: this.sprintTimer
    };
  }

  setData(_data) {
    super.setData(_data);
    this.name = _data.name !== undefined ? _data.name : this.name;
    this.dead = _data.dead !== undefined ? _data.dead : this.dead;
    this.moveHeading = new Vector(
      !isNaN(_data.moveHeadingX) ? _data.moveHeadingX : this.moveHeading.x, 
      !isNaN(_data.moveHeadingY) ? _data.moveHeadingY : this.moveHeading.y
    );
    this.sprint = _data.sprint !== undefined ? _data.sprint : this.sprint;
    this.sprintTimer = _data.sprintTimer !== undefined ? _data.sprintTimer : this.sprintTimer;
    this.spriteName = _data.spriteName !== undefined ? _data.spriteName : this.spriteName;
    this.score = _data.score !== undefined ? _data.score : this.score;
    if (this.renderer) {
      this.renderer.playerName = this.name;
      this.renderer.spriteName = this.spriteName;
    }
    return this;
  }
}
