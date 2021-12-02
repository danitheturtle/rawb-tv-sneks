import Victor from 'victor';
import * as physics from './physics';
import * as time from './time';
import { GameObject, CircleCollider } from './physicsObjects';
import { randomVec, norm, lerp, clamp } from './utils';
import { GLOBALS } from './state';
const Vector = Victor;

export class SnakeCollider extends CircleCollider {
  constructor(_radius, _bodyPartCount = GLOBALS.initialSnakeSize) {
    super(_radius);
    this.bodyPartCount = _bodyPartCount;
    this.pointPath = [];
    this.parts = [];
    this.type = 'snake';
    this.parent = undefined;
  }

  update() {
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
    for (let i = 0; i < this.parts.length; i++) {
      const minDistSq = this.radius * this.radius + pickupRadius * pickupRadius;
      const partCenter = this.parts[i].clone();
      if (partCenter.subtract(pickupCenter).lengthSq() < minDistSq) {
        return true;
      }
    }
    return false;
  }

  getData() {
    return {
      type: this.type,
      radius: this.radius,
      bodyPartCount: this.bodyPartCount,
      pointPath: this.pointPath.map(p => ([p.x, p.y])),
      parts: this.parts.map(p => [p.x, p.y])
    }
  }

  setData(_data, _parent) {
    this.parent = _parent;
    this.type = _data.type;
    this.radius = _data.radius;
    this.bodyPartCount = _data.bodyPartCount;
    this.pointPath = _data.pointPath.map(p => (new Vector(p[0], p[1])));
    this.parts = _data.parts.map(p => (new Vector(p[0], p[1])));
  }
}

export class Player extends GameObject {
  constructor(_gameStateRef, _clientId, _pos, _vel, _accel, _collider, _renderer) {
    super(_gameStateRef, _pos, _vel, _accel, _collider, _renderer)
    //Store their ID
    this.clientId = _clientId;
    //Did the player recently die?
    this.dead = false;

    //Player input tracking.  Everything is false/blank by default
    this.moveHeading = randomVec();
    this.sprint = false;
    this.sprintTimer = 0;

    //snake data
    this.bodySpacing = 1.75;
    this.collider.pointPath.push(this.pos.clone());
    
    //Player sprite
    this.spriteName = null;
  }

  update() {
    if (this.dead) {

    } else {
      //accelerate towards moveHeading, clamp speed
      this.accel = this.moveHeading.clone().multiplyScalar(GLOBALS.baseAccelSpeed);
      // this.accel = this.vel.clone().normalize();
      // // console.dir(`${this.moveHeading.angleDeg()} ${this.accel.angleDeg()}`)
      // const angleDiff = (180+this.moveHeading.angleDeg()) - (180+this.accel.angleDeg());
      // const angleDir = angleDiff > 0 ? 1 : -1;
      // const clampedDegToRotate = clamp(Math.abs(angleDiff), 0, 90)*angleDir;
      // this.accel.rotateDeg(clampedDegToRotate).multiplyScalar(GLOBALS.baseAccelSpeed);
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

  die() {
    this.dead = true;
    this.collider.setBodyPartCount(GLOBALS.initialSnakeSize);
  }

  getData() {
    return {
      ...super.getData(),
      clientId: this.clientId,
      time: this.gameStateRef.time.clientTimers[this.clientId],
      moveHeadingX: this.moveHeading.x,
      moveHeadingY: this.moveHeading.y,
      sprint: this.sprint,
      sprintTimer: this.sprintTimer,
      spriteName: this.spriteName
    };
  }

  setData(data) {
    super.setData(data, this.gameStateRef.time.clientTimers[data.clientId] - data.time);
    this.clientId = data.clientId;
    this.moveHeading = new Vector(data.moveHeadingX, data.moveHeadingY);
    this.sprint = data.sprint;
    this.sprintTimer = data.sprintTimer;
    this.gameStateRef.time.clientTimers[data.clientId] = data.time;
    this.spriteName = data.spriteName;
    if (this.renderer) {
      this.renderer.spriteName = this.spriteName;
    }
  }

  setClientData(data) {
    this.gameStateRef.time.clientTimers[data.clientId] = data.time;
  }
}
