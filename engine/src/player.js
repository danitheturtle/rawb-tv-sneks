import Victor from 'victor';
import * as physics from './physics';
import * as time from './time';
import { GameObject, CircleCollider } from './physicsObjects';
import { randomVec, randomInt, norm, lerp, clamp } from './utils';
import { GLOBALS } from './state';
const Vector = Victor;

export class SnakeCollider extends CircleCollider {
  constructor() {
    super();
    this.initialRadius = 2;
    this.bodyPartCount = GLOBALS.initialSnakeSize;
    this.pointPath = [];
    this.parts = [];
    this.type = 'snake';
    this.parent = undefined;
  }

  update() {
    if (!this.parent) return;
    if (this.pointPath.length < 1) { this.pointPath.push(this.parent.pos.clone()); }
    //Update radius based on score
    this.radius = this.initialRadius + Math.min(this.bodyPartCount / 100, 8);
    //have we reached radius*parent.bodySpacing distance from last set snake point?
    const scaledRadiusDist = this.radius * this.parent.bodySpacing;
    const lastPointToPlayerPos = this.parent.pos.clone().subtract(this.pointPath[0]);
    const distToLastPoint = lastPointToPlayerPos.length();
    if (distToLastPoint >= scaledRadiusDist) {
      this.addNextPoint(this.parent.pos.clone());
    }

    if (!!this.parts[0]) {
      this.parts[0].x = this.parent.pos.x;
      this.parts[0].y = this.parent.pos.y;
    } else {
      this.parts[0] = new Vector(this.parent.pos.x, this.parent.pos.y);
    }
    const partDistFromNextPoint = Math.max(scaledRadiusDist - distToLastPoint, 0);
    for (let i = 0; i < this.bodyPartCount - 1; i++) {
      const thisPathPoint = i > this.pointPath.length - 1 ?
        this.pointPath[this.pointPath.length - 1] :
        this.pointPath[i]
      const nextPathPoint = i + 1 > this.pointPath.length - 1 ?
        this.pointPath[this.pointPath.length - 1] :
        this.pointPath[i + 1];

      const partLocation = partDistFromNextPoint !== 0 ?
        nextPathPoint.clone()
        .subtract(thisPathPoint)
        .normalize()
        .multiplyScalar(partDistFromNextPoint)
        .add(thisPathPoint) :
        nextPathPoint.clone();

      if (!!this.parts[i + 1]) {
        this.parts[i + 1].x = partLocation.x;
        this.parts[i + 1].y = partLocation.y;
      } else {
        this.parts[i + 1] = new Vector(partLocation.x, partLocation.y);
      }
    }
  }
  
  reset() {
    this.pointPath = [this.parent.pos.clone()];
    this.parts = [];
    this.bodyPartCount = GLOBALS.initialSnakeSize;
    this.radius = this.initialRadius;
  }

  increaseBodyPartCount(_amount) {
    this.bodyPartCount += _amount;
  }

  decreaseBodyPartCount(_amount) {
    this.bodyPartCount -= _amount;
    this.parts = this.parts.slice(0, this.bodyPartCount);
    this.pointPath = this.pointPath.slice(0, this.bodyPartCount);
  }

  setBodyPartCount(_amount) {
    this.bodyPartCount = _amount;
    if (this.pointPath.length >= _amount) {
      this.pointPath = this.pointPath.slice(0, this.bodyPartCount);
    }
  }

  addNextPoint(_point) {
    if (this.pointPath.length >= this.bodyPartCount) {
      for (let i = this.pointPath.length - 1; i > 0; i--) {
        this.pointPath[i] = this.pointPath[i - 1];
      }
      this.pointPath[0] = _point;
    } else {
      this.pointPath.unshift(_point);
    }
  }

  checkCollisionWithOtherSnake(_other) {
    const otherCenter = _other.pointPath[0];
    const otherRadius = _other.radius;
    for (let i = 0; i < this.parts.length; i++) {
      const minDistSq = this.radius * this.radius + otherRadius * otherRadius;
      const partCenter = this.parts[i].clone();
      if (partCenter.subtract(otherCenter).lengthSq() < minDistSq) {
        return true;
      }
    }
    return false;
  }

  checkCollisionWithPickup(_pickup) {
    const pickupCenter = _pickup.pos;
    const pickupRadius = _pickup.collider.radius;
    const minDistSq = this.radius * this.radius + pickupRadius * pickupRadius;
    const partCenter = this.parts[0].clone();
    if (partCenter.subtract(pickupCenter).lengthSq() < minDistSq) {
      return true;
    }
    return false;
  }

  getData() {
    return {
      type: this.type,
      initialRadius: this.initialRadius,
      bodyPartCount: this.bodyPartCount,
      pointPath: this.pointPath.map(p => ([p.x, p.y])),
      parts: this.parts.map(p => ([p.x, p.y]))
    }
  }

  setData(_data, _parent) {
    this.parent = _parent !== undefined ? _parent : this.parent;
    this.type = _data.type !== undefined ? _data.type : this.type;
    this.initialRadius = _data.initialRadius !== undefined ? _data.initialRadius : this.initialRadius;
    this.bodyPartCount = _data.bodyPartCount !== undefined ? _data.bodyPartCount : this.bodyPartCount;
    this.pointPath = _data.pointPath !== undefined ? _data.pointPath.map(p => (new Vector(p[0], p[1]))) : this.pointpath;
    this.parts = _data.parts !== undefined ? _data.parts.map(p => (new Vector(p[0], p[1]))) : this.parts;
    return this;
  }
}

export class Player extends GameObject {
  constructor(_gameStateRef) {
    super(_gameStateRef);
    //Did the player recently die?
    this.dead = false;
    this.respawning = false;

    //Player input tracking.  Everything is false/blank by default
    this.moveHeading = randomVec();
    this.sprint = false;
    this.sprintTimer = 0;

    //snake data
    this.bodySpacing = 1.75;
    
    //Player sprite
    this.spriteName = null;
  }

  update() {
    if (!this.dead) {
      //Rotate towards heading, clamp degrees so you can't turn around on the spot
      this.accel = this.vel.clone().normalize();
      const angleDiff = (180+this.moveHeading.angleDeg()) - (180+this.accel.angleDeg());
      const angleDir = angleDiff > 0 ? 1 : -1;
      const clampedDegToRotate = clamp(Math.abs(angleDiff), 0, 90)*(Math.abs(angleDiff) > 180 ? -angleDir : angleDir);
      this.accel.rotateDeg(clampedDegToRotate).multiplyScalar(GLOBALS.baseAccelSpeed);
      //Add acceleration to the velocity scaled by dt.  Limit the velocity so collisions don't break
      this.vel.add(this.accel.multiplyScalar(time.dt()));
      //limit velocity with current max speed (squared since its cheaper)
      const currentMaxSpeed = this.sprint && this.collider.parts.length > 5 ? 
        GLOBALS.sprintMult * GLOBALS.sprintMult * GLOBALS.baseMoveSpeed * GLOBALS.baseMoveSpeed : 
        GLOBALS.baseMoveSpeed * GLOBALS.baseMoveSpeed;
      if (this.vel.lengthSq() > currentMaxSpeed) {
        this.vel.normalize().multiplyScalar(this.sprint && this.collider.parts.length > 5 ? GLOBALS.baseMoveSpeed * GLOBALS.sprintMult : GLOBALS.baseMoveSpeed);
      }
      //Add velocity to the position scaled by dt
      this.pos.add(this.vel.clone().multiplyScalar(time.dt()));
      
      //Sprint decreases snake length. If snake is too short, stop sprinting
      if (this.sprint) {
        if (this.sprintTimer % 30 === 0 && this.collider.parts.length > 5) {
          this.collider.decreaseBodyPartCount(1);
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
  
  isOutOfBounds() {
    const xMin = this.pos.x - this.collider.radius;
    const yMin = this.pos.y - this.collider.radius;
    const xMax = this.pos.x + this.collider.radius;
    const yMax = this.pos.y + this.collider.radius;
    if (
      xMin < 0 ||
      yMin < 0 ||
      xMax > this.gameStateRef.level?.activeLevelData.guWidth || 
      yMax > this.gameStateRef.level?.activeLevelData.guHeight
    ) {
      return true;
    } else {
      return false;
    }
  }
  
  die() {
    this.dead = true;
  }
  
  respawn() {
    this.respawning = true;
  }
  
  respawned() {
    this.respawning = false;
    this.dead = false;
  }

  getData() {
    return {
      ...super.getData(),
      dead: this.dead,
      respawning: this.respawning,
      moveHeadingX: this.moveHeading.x,
      moveHeadingY: this.moveHeading.y,
      sprint: this.sprint,
      sprintTimer: this.sprintTimer,
      spriteName: this.spriteName
    };
  }

  setData(_data) {
    super.setData(_data);
    this.dead = _data.dead !== undefined ? _data.dead : this.dead;
    this.respawning = _data.respawning !== undefined ? _data.respawning : this.respawning;
    this.moveHeading = new Vector(
      _data.moveHeadingX !== undefined ? _data.moveHeadingX : this.moveHeading.x, 
      _data.moveHeadingY !== undefined ? _data.moveHeadingY : this.moveHeading.y
    );
    this.sprint = _data.sprint !== undefined ? _data.sprint : this.sprint;
    this.sprintTimer = _data.sprintTimer !== undefined ? _data.sprintTimer : this.sprintTimer;
    this.spriteName = _data.spriteName !== undefined ? _data.spriteName : this.spriteName;
    if (this.renderer) {
      this.renderer.spriteName = this.spriteName;
    }
    return this;
  }

  setClientData(data) {
  }
}
