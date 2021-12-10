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

// export class Collider {
//   constructor() {
//     this.type = 'point';
//   }

//   get center() {
//     return this.parent.pos.clone();
//   }

//   getData() {
//     return {
//       type: this.type
//     }
//   }

//   getDataForNetworkUpdate() {
//     return this.getData();
//   }

//   setData(_data, _parent) {
//     this.parent = _parent !== undefined ? _parent : this.parent;
//     return this;
//   }
// }

export class CircleCollider {
  constructor() {
    this.radius = 2;
  }
}


// export class CircleCollider extends Collider {
//   constructor() {
//     super();
//     this.radius = 2;
//     this.type = "circle";
//   }

//   getData() {
//     return {
//       type: this.type,
//       radius: this.radius
//     }
//   }

//   getDataForNetworkUpdate() {
//     return this.getData();
//   }

//   setData(_data, _parent) {
//     super.setData(_data, _parent);
//     this.radius = _data.radius !== undefined ? _data.radius : this.radius;
//     return this;
//   }
// }

// export class BoxCollider extends Collider {
//   constructor() {
//     super();
//     this.width = 1;
//     this.height = 1;
//     this.type = "boundingBox";
//   }

//   get center() {
//     return this.parent.pos.clone().add(new Vector(this.width / 2, this.height / 2));
//   }

//   get centerToCorner() {
//     return this.center.subtract(this.parent.pos);
//   }

//   xMin(set = undefined) {
//     if (set === undefined) {
//       return this.parent.pos.x;
//     } else {
//       this.parent.pos.x = set;
//     }
//   }

//   xMax(set = undefined) {
//     if (set === undefined) {
//       return this.parent.pos.x + this.width;
//     } else {
//       this.parent.pos.x = set - this.width;
//     }
//   }

//   yMin(set = undefined) {
//     if (set == undefined) {
//       return this.parent.pos.y;
//     } else {
//       this.parent.pos.y = set;
//     }
//   }

//   yMax(set = undefined) {
//     if (set == undefined) {
//       return this.parent.pos.y + this.height;
//     } else {
//       this.parent.pos.y = set - this.height;
//     }
//   }

//   getData() {
//     return {
//       type: this.type,
//       width: this.width,
//       height: this.height
//     }
//   }

//   getDataForNetworkUpdate() {
//     return this.getData();
//   }

//   setData(_data, _parent) {
//     this.width = _data.width !== undefined ? _data.width : this.width;
//     this.height = _data.height !== undefined ? _data.height : this.height;
//     this.parent = _parent !== undefined ? _parent : this.parent;
//     return this;
//   }
// }

export class GameObject {
  constructor(_gameStateRef) {
    this.gameStateRef = _gameStateRef;
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
      collider: this.collider?.getData(),
      renderer: this.renderer?.getData()
    }
  }
  getDataForNetworkUpdate() {
    return {
      id: this.id,
      x: this.pos.x,
      y: this.pos.y,
      velX: this.vel.x,
      velY: this.vel.y,
      accelX: this.accel.x,
      accelY: this.accel.y,
      hasCollisions: this.hasCollisions,
      collider: this.collider?.getDataForNetworkUpdate(),
      renderer: this.renderer?.getDataForNetworkUpdate()
    }
  }
  setData(data) {
    //If id is unset, set it
    if (!this.id) {
      this.id = data.id;
    }
    this.pos.x = data.x !== undefined ? data.x : this.pos.x;
    this.pos.y = data.y !== undefined ? data.y : this.pos.y;
    this.vel.x = data.velX !== undefined ? data.velX : this.vel.x;
    this.vel.y = data.velY !== undefined ? data.velY : this.vel.y;
    this.accel.x = data.accelX !== undefined ? data.accelX : this.accel.x;
    this.accel.y = data.accelY !== undefined ? data.accelY : this.accel.y;
    this.hasCollisions = data.hasCollisions !== undefined ? data.hasCollisions : this.hasCollisions;
    if (!this.collider && data.collider) {
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
    } else if (data.collider) {
      this.collider.setData(data.collider, this);
    }
    if (data.renderer) {
      this.renderer?.setData(data.renderer, this);
    }
    return this;
  }
}
