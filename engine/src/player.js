import Victor from 'victor';
import * as physics from './physics';
import * as time from './time';
import { GameObject, CircleCollider } from './physicsObjects';
import { randomVec, norm, lerp } from './utils';
import { GLOBALS } from './state';
const Vector = Victor;

export class SnakeCollider extends CircleCollider {
  constructor(_radius, _bodyPartCount = 5) {
    super(_radius);
    this.bodyPartCount = _bodyPartCount;
    this.pointPath = [];
    this.parts = {};
    this.type = 'snake';
    this.parent = undefined;
    const thisRef = this;
    const updateCountLoop = () => {
      this.increaseBodyPartCount(1);
      setTimeout(updateCountLoop, 1000);
    }
    updateCountLoop();
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
      this.parts[0][0] = this.parent.pos.x;
      this.parts[0][1] = this.parent.pos.y;
    } else {
      this.parts[0] = [this.parent.pos.x, this.parent.pos.y];
    }
    const partDistFromNextPoint = Math.max(scaledRadiusDist - distToLastPoint, 0);
    for (let i = 0; i < this.bodyPartCount - 1; i++) {
      const thisPathPoint = i > this.pointPath.length-1 ? 
        this.pointPath[this.pointPath.length-1] : 
        this.pointPath[i]
      const nextPathPoint = i+1 > this.pointPath.length-1 ? 
        this.pointPath[this.pointPath.length-1] :
        this.pointPath[i + 1];
        
      const partLocation = partDistFromNextPoint !== 0 ? 
        nextPathPoint.clone()
          .subtract(thisPathPoint)
          .normalize()
          .multiplyScalar(partDistFromNextPoint)
          .add(thisPathPoint) :
        nextPathPoint.clone();
      
      if (!!this.parts[i+1]) {
        this.parts[i+1][0] = partLocation.x;
        this.parts[i+1][1] = partLocation.y;
      } else {
        this.parts[i+1] = [partLocation.x, partLocation.y];
      }
    }
  }

  increaseBodyPartCount(_amount) {
    this.bodyPartCount += _amount;
  }

  decreaseBodyPartCount(_amount) {
    this.bodyPartCount += _amount;
    this.pointPath = this.pointPath.slice(0, this.bodyPartCount);
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

  getData() {
    return {
      type: this.type,
      radius: this.radius,
      bodyPartCount: this.bodyPartCount,
      pointPath: this.pointPath.map(p => ([p.x, p.y])),
      parts: this.parts
    }
  }

  setData(_data) {
    this.type = _data.type;
    this.radius = _data.radius;
    this.bodyPartCount = _data.bodyPartCount;
    this.pointPath = _data.pointPath.map(p => (new Vector(p[0], p[1])));
    this.parts = _data.parts;
  }
}

export class Player extends GameObject {
  constructor(_gameStateRef, _clientId, _pos, _vel, _accel, _collider, _renderer) {
    super(_gameStateRef, _pos, _vel, _accel, _collider, _renderer)
    //Store their ID
    this.clientId = _clientId;

    //Player input tracking.  Everything is false/blank by default
    this.moveHeading = randomVec();
    this.sprint = false;

    //snake data
    this.bodySpacing = 1.75;
    this.collider.pointPath.push(this.pos.clone());

    //custom spritesheet support for meme potential
    this.customSpritesheetURL = null;
  }

  update() {
    //accelerate towards moveHeading, clamp speed
    this.accel = this.moveHeading.clone().multiplyScalar(this.gameStateRef.physics.accelSpeed);
    super.update();
    this.collider?.update();
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
