import Victor from 'victor';
import * as utils from './utils';
import * as time from './time';
import { GLOBALS } from './state';
const Vector = Victor;

export const update = (_state) => {
  const sp = _state.physics;
  //Update gameObjects
  for (const goID in sp.gameObjects) {
    const obj = sp.gameObjects[goID];
    //Update the object
    obj.update(_state);
  }
}

export class Collider {
  constructor() {
    this.type = 'point';
  }

  get center() {
    return this.parent.pos.clone();
  }

  getData() {
    return {
      type: this.type
    }
  }

  setData(_data, _parent) {
    this.parent = _parent !== undefined ? _parent : this.parent;
    return this;
  }
}

export class CircleCollider extends Collider {
  constructor() {
    super();
    this.radius = 2;
    this.type = "circle";
  }

  getData() {
    return {
      type: this.type,
      radius: this.radius
    }
  }

  setData(_data, _parent) {
    super.setData(_data, _parent);
    this.radius = _data.radius !== undefined ? _data.radius : this.radius;
    return this;
  }
}

export class SnakeCollider extends CircleCollider {
  constructor() {
    super();
    this.initialRadius = 2;
    this.bodyPartCount = GLOBALS.initialSnakeSize;
    this.pointPath = [];
    this.type = 'snake';
    this.parent = undefined;
  }

  update() {
    if (!this.parent) return;
    if (this.pointPath.length < 1 ) { this.pointPath.push(this.parent.pos.clone()); }
    //Update radius based on score
    this.radius = this.initialRadius + Math.min(this.bodyPartCount / 100, 8);
    //have we reached radius*parent.bodySpacing distance from last set snake point?
    const scaledRadiusDist = this.initialRadius * this.parent.bodySpacing;
    const lastPointToPlayerPos = this.parent.pos.clone().subtract(this.pointPath[0]);
    const distToLastPoint = lastPointToPlayerPos.length();
    if (distToLastPoint >= scaledRadiusDist) {
      this.addNextPoint(this.pointPath[0].clone().add(lastPointToPlayerPos.normalize().multiplyScalar(scaledRadiusDist)));
    }
  }
  
  reset() {
    this.pointPath = [this.parent.pos.clone()];
    this.bodyPartCount = GLOBALS.initialSnakeSize;
    this.radius = this.initialRadius;
    if (this.parent.renderer) {
      this.parent.renderer.parts = [];
    }
  }
  
  updateBodyWithScore() {
    if (!this.parent) return;
    const newBodyPartCount = Math.max(
      GLOBALS.initialSnakeSize, 
      Math.floor(this.parent.score/GLOBALS.scoreLengthDivider) + 5
    );
    if (newBodyPartCount !== this.bodyPartCount) {
      this.setBodyPartCount(newBodyPartCount);
    }
  }

  setBodyPartCount(_amount) {
    this.bodyPartCount = _amount;
    if (this.pointPath.length >= _amount) {
      this.pointPath = this.pointPath.slice(0, this.bodyPartCount);
    }
    if (this.parent.renderer && this.parent.renderer.parts.length >= _amount) {
      this.parent.renderer.parts = this.parent.renderer.parts.slice(0, this.bodyPartCount);
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

  checkCollisionWithPickup(_pickup) {
    const pickupCenter = _pickup.pos;
    const pickupRadius = _pickup.collider.radius;
    const minDistSq = this.radius * this.radius + pickupRadius * pickupRadius + GLOBALS.pickupRadius;
    const playerCenter = this.parent.pos.clone();
    if (playerCenter.subtract(pickupCenter).lengthSq() < minDistSq) {
      return true;
    }
    return false;
  }

  checkCollisionWithOtherSnake(_other) {
    //returns 0 if no collision, 1 if other's head collided with this' body, 2 if this' head collided with other's body, or 3 if other's head collided with this' head
    const headX0 = this.parent.pos.x;
    const headY0 = this.parent.pos.y;
    const radius0 = this.radius;
    const path0 = this.pointPath;
    const headX1 = _other.parent.pos.x;
    const headY1 = _other.parent.pos.y;
    const radius1 = _other.radius;
    const path1 = _other.pointPath;
    const r = radius0 + radius1;
    const r2 = r*r;
    const dx0 = headX0 - headX1;
    const dy0 = headY0 - headY1;
    //1 head collide with 0 head
    if (dx0*dx0 + dy0*dy0 < r2) {
      return 3;
    }
    //0 head collide with 1 body
    for (let i=0; i < path1.length - 1; i++) {
      const dx1 = path1[i].x - headX0;
      const dy1 = path1[i].y - headY0;
      if (dx1*dx1 + dy1*dy1 < r2) {
        return 2;
      }
    }
    //1 head collide with 0 body
    for (let j=0; j < path0.length - 1; j++) {
      const dx2 = path0[j].x - headX1;
      const dy2 = path0[j].y - headY1;
      if (dx2*dx2 + dy2*dy2 < r2) {
        return 1;
      }
    }
    //no collision
    return 0;
  }
  
  isOutOfBounds(_state) {
    const xMin = this.pointPath[0].x - this.radius;
    const yMin = this.pointPath[0].y - this.radius;
    const xMax = this.pointPath[0].x + this.radius;
    const yMax = this.pointPath[0].y + this.radius;
    if (
      xMin < 0 ||
      yMin < 0 ||
      xMax > _state.level?.activeLevelData.guWidth || 
      yMax > _state.level?.activeLevelData.guHeight
    ) {
      return true;
    } else {
      return false;
    }
  }

  getData() {
    return {
      type: this.type,
      initialRadius: this.initialRadius,
      bodyPartCount: this.bodyPartCount,
      pointPath: this.pointPath.map(p => ([p.x, p.y]))
    }
  }
  
  getServerUpdateData() {
    return {
      type: this.type,
      bodyPartCount: this.bodyPartCount
    };
  }

  setData(_data, _parent) {
    this.parent = _parent !== undefined ? _parent : this.parent;
    this.type = _data.type !== undefined ? _data.type : this.type;
    this.initialRadius = _data.initialRadius !== undefined ? _data.initialRadius : this.initialRadius;
    this.bodyPartCount = _data.bodyPartCount !== undefined ? _data.bodyPartCount : this.bodyPartCount;
    this.pointPath = _data.pointPath !== undefined ? _data.pointPath.map(p => (new Vector(p[0], p[1]))) : this.pointPath;
    return this;
  }
}

export class GameObject {
  constructor() {
    this.id = undefined;
    this.pos = new Vector(0,0);
    this.vel = new Vector(0,0);
    this.accel = new Vector(0,0);
    this.hasCollisions = true;
    this.collider = undefined;
    this.renderer = undefined;
  }
  
  assignId(_id) {
    this.id = _id;
    return this;
  }
  
  addCollider(_collider) {
    this.collider = _collider;
    this.collider.parent = this;
    return this;
  }
  
  addRenderer(_renderer) {
    this.renderer = _renderer;
    this.renderer.parent = this;
    return this;
  }

  update(_state) {
    //Add acceleration to the velocity scaled by dt.  Limit the velocity so collisions don't break
    this.vel.add(this.accel.multiplyScalar(time.dt(_state)));
    //limit velocity with game speed
    if (this.vel.lengthSq() > _state.physics.moveSpeed * _state.physics.moveSpeed) {
      this.vel.normalize().multiplyScalar(_state.physics.moveSpeed);
    }
    //Add velocity to the position scaled by dt
    this.pos.add(this.vel.clone().multiplyScalar(time.dt(_state)));

    //Reset acceleration
    this.accel = new Vector(0.0, 0.0);
  }
  
  draw(_state) {
    if (this.renderer) {
      this.renderer.draw(_state);
    }
  }

  getData() {
    return {
      id: this.id,
      x: this.pos.x,
      y: this.pos.y,
      velX: this.vel.x,
      velY: this.vel.y,
      accelX: this.accel.x,
      accelY: this.accel.y,
      hasCollisions: this.hasCollisions,
      collider: this.collider?.getData(),
      renderer: this.renderer?.getData()
    }
  }
  
  setData(data) {
    //If id is unset, set it
    if (!this.id) {
      this.id = data.id;
    }
    this.pos.x = !isNaN(data.x) ? data.x : this.pos.x;
    this.pos.y = !isNaN(data.y) ? data.y : this.pos.y;
    this.vel.x = !isNaN(data.velX) ? data.velX : this.vel.x;
    this.vel.y = !isNaN(data.velY) ? data.velY : this.vel.y;
    this.accel.x = !isNaN(data.accelX) ? data.accelX : this.accel.x;
    this.accel.y = !isNaN(data.accelY) ? data.accelY : this.accel.y;
    this.hasCollisions = data.hasCollisions !== undefined ? data.hasCollisions : this.hasCollisions;
    if (!this.collider && data.collider) {
      switch (data.collider.type) {
        case 'circle':
          this.collider = new CircleCollider().setData(data.collider, this);
          break;
        default:
          this.collider = new Collider().setData(data.collider, this);
          break;
      }
    } else if (data.collider) {
      this.collider.setData(data.collider, this);
    }
    if (data.renderer) {
      this.renderer?.setData(data.renderer, this);
    }
    return this;
  }
}
