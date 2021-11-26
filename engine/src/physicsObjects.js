import Victor from 'victor';
import time from './time';
import physics from './index';
const Vector = Victor;

export class Manifold {
  constructor(_norm = new Vector(0.0, 0.0), _penetration = new Vector(0.0, 0.0)) {
    this.norm = _norm;
    this.penetration = _penetration;
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

  setData() {}
}

export class CircleCollider extends Collider {
  constructor(_radius) {
    super();
    this.radius = _radius;
    this.type = "circle";
  }
  get radius() {
    return this.radius;
  }

  getData() {
    return {
      type: this.type,
      radius: this.radius
    }
  }

  setData(data) {
    this.radius = data?.radius;
  }
}

export class BoxCollider extends Collider {
  constructor(_width, _height) {
    super();
    this.width = _width;
    this.height = _height;
    this.type = "boundingBox";
  }

  get center() {
    return this.parent.pos.clone().add(new Vector(this.width / 2, this.height / 2));
  }

  get centerToCorner() {
    return this.center.subtract(this.parent.pos);
  }

  xMin(set = undefined) {
    if (set === undefined) {
      return this.parent.pos.x;
    } else {
      this.parent.pos.x = set;
    }
  }

  xMax(set = undefined) {
    if (set === undefined) {
      return this.parent.pos.x + this.width;
    } else {
      this.parent.pos.x = set - this.width;
    }
  }

  yMin(set = undefined) {
    if (set == undefined) {
      return this.parent.pos.y;
    } else {
      this.parent.pos.y = set;
    }
  }

  yMax(set = undefined) {
    if (set == undefined) {
      return this.parent.pos.y + this.height;
    } else {
      this.parent.pos.y = set - this.height;
    }
  }

  getData() {
    return {
      type: this.type,
      width: this.width,
      height: this.height
    }
  }

  setData(data) {
    this.width = data.width;
    this.height = data.height;
  }
}

export class GameObject {
  constructor(_gameStateRef, _pos, _collider, _vel = new Vector(0.0, 0.0), _accel = new Vector(0.0, 0.0)) {
    this.gameStateRef = _gameStateRef;
    this.id = this.gameStateRef.physics.lastGameObjectID++;
    this.pos = _pos;
    this.vel = _vel;
    this.accel = _accel;
    this.hasCollisions = true;
    this.collider = _collider;
    this.collider.parent = this;
  }

  update() {
    //Add acceleration to the velocity scaled by dt.  Limit the velocity so collisions don't break
    this.vel.add(this.accel.multiplyScalar(time.dt())).limit(this.gameStateRef.physics.speedLimit, 0.75);
    //Add velocity to the position scaled by dt
    this.pos.add(this.vel.clone().multiplyScalar(time.dt()));

    //Reset acceleration
    this.accel = new Vector(0.0, 0.0);
  }

  applyCollisions(otherObjects) {
    if (!this.hasCollisions) return;
    for (let k = 0; k < otherObjects.length; k++) {
      const collisionManifold = physics.collide(this.collider, otherObjects[k].collider);
      if (collisionManifold.norm.lengthSq() < 1.0) continue;
      console.dir("Collision detected!")
    }
  }

  getData() {
    return {
      id: this.id,
      x: this.pos.x,
      y: this.pos.y,
      velX: this.vel.x,
      velY: this.vel.y,
      hasCollisions: this.hasCollisions,
      collider: this.collider.getData()
    }
  }
  setData(data, timeDelta = 0) {
    //Calculate new pos based on latency
    let newPos = new Vector(data.x + data.velX * timeDelta, data.y + data.velY * timeDelta);
    //If the changed distance is less than 1gu, lerp it
    if (newPos.distanceSq(this.pos) < 1) {
      index
      this.pos = new Vector(data.x + data.velX * timeDelta, data.y + data.velY * timeDelta).mix(this.pos, 0.5);
      //Otherwise, just set the position
    } else {
      this.pos = newPos;
    }
    this.vel.x = data.velX;
    this.vel.y = data.velY;
    this.hasCollisions = data.hasCollisions;
    switch (data.collider.type) {
      case 'circle':
        this.collider = new CircleCollider().setData(data.collider);
        break;
      case 'boundingBox':
        this.collider = new BoxCollider().setData(data.collider);
        break;
      default:
        this.collider = new Collider().setData(data.collider);
        break;
    }
  }
}
