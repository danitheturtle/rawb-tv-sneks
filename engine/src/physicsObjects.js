import Victor from 'victor';
import * as time from './time';
import * as physics from './index';
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

  setData(_data, _parent) {
    this.parent = _parent
  }
}

export class CircleCollider extends Collider {
  constructor(_radius) {
    super();
    this.radius = _radius;
    this.type = "circle";
  }

  getData() {
    return {
      type: this.type,
      radius: this.radius
    }
  }

  setData(_data, _parent) {
    this.radius = _data?.radius;
    this.parent = _parent;
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

  setData(_data, _parent) {
    this.width = _data.width;
    this.height = _data.height;
    this.parent = _parent;
  }
}

export class GameObject {
  constructor(_gameStateRef, _pos, _vel = new Vector(0.0, 0.0), _accel = new Vector(0.0, 0.0), _collider = new CircleCollider(2), _renderer = undefined) {
    this.gameStateRef = _gameStateRef;
    this.id = this.gameStateRef.physics.lastGameObjectID++;
    this.pos = _pos;
    this.vel = _vel;
    this.accel = _accel;
    this.hasCollisions = true;
    this.collider = _collider;
    this.renderer = _renderer;
    this.collider.parent = this;
    if (this.renderer) {
      this.renderer.parent = this;
    }
    this.gameStateRef.physics.gameObjects[this.id] = this;
  }

  update() {
    //Add acceleration to the velocity scaled by dt.  Limit the velocity so collisions don't break
    this.vel.add(this.accel.multiplyScalar(time.dt()));
    //limit velocity with game speed
    if (this.vel.lengthSq() > this.gameStateRef.physics.moveSpeed * this.gameStateRef.physics.moveSpeed) {
      this.vel.normalize().multiplyScalar(this.gameStateRef.physics.moveSpeed);
    }
    //Add velocity to the position scaled by dt
    this.pos.add(this.vel.clone().multiplyScalar(time.dt()));

    //Reset acceleration
    this.accel = new Vector(0.0, 0.0);
  }
  
  draw() {
    if (this.renderer) {
      this.renderer.draw();
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
      collider: this.collider.getData(),
      renderer: this.renderer?.getData()
    }
  }
  setData(data, timeDelta = 0) {
    //Calculate new pos based on latency
    let newPos = new Vector(data.x + data.velX * timeDelta, data.y + data.velY * timeDelta);
    //If the changed distance is less than 1gu, lerp it
    if (newPos.distanceSq(this.pos) < 1) {
      this.pos = new Vector(data.x + data.velX * timeDelta, data.y + data.velY * timeDelta).mix(this.pos, 0.5);
      //Otherwise, just set the position
    } else {
      this.pos = newPos;
    }
    this.vel.x = data.velX;
    this.vel.y = data.velY;
    this.accel.x = data.accelX;
    this.accel.y = data.accelY;
    this.hasCollisions = data.hasCollisions;
    if (!this.collider) {
      switch (data.collider.type) {
        case 'circle':
        this.collider = new CircleCollider().setData(data.collider, this);
        break;
        case 'boundingBox':
        this.collider = new BoxCollider().setData(data.collider, this);
        break;
        default:
        this.collider = new Collider().setData(data.collider, this);
        break;
      }
    } else {
      this.collider.setData(data.collider, this);
    }
    if (data.renderer) {
      this.renderer?.setData(data.renderer, this);
    }
  }
}
