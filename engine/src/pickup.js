import Victor from 'victor';
import { GameObject, CircleCollider } from './physics';
import { GLOBALS } from './state';
const Vector = Victor;

export class Pickup extends GameObject {
  constructor() {
    super();
    this.pickupType = "regularCheese";
    this.worth = 1;
    this.collectedBy = undefined;
    this.accelTowards = undefined;
    this.dirty = false;
  }
  
  update(_state) {
    super.update(_state);
    const s = _state;
    const sg = s.game;
    if (this.accelTowards !== undefined) {
      const player = sg.players[this.accelTowards];
      if (!player?.pos || !this?.pos) return;
      const distToPlayerSq = player.pos.clone().subtract(this.pos).lengthSq();
      const minAccelRadius = player.collider.radius * player.collider.radius + this.collider.radius * this.collider.radius + GLOBALS.attractRadius * GLOBALS.attractRadius;
      if (distToPlayerSq > minAccelRadius) {
        this.accelTowards = undefined;
        this.accel = this.vel.clone().multiplyScalar(-1);
      }
    } else {
      this.accel = this.vel.clone().multiplyScalar(-1);
    }
  }
  
  getData() {
    return {
      ...super.getData(),
      pickupType: this.pickupType,
      worth: this.worth,
      collectedBy: this.collectedBy,
      accelTowards: this.accelTowards
    }
  }
  
  getServerUpdateData() {
    return {
      id: this.id,
      x: this.pos.x,
      y: this.pos.y,
      velX: this.vel.x,
      velY: this.vel.y,
      accelX: this.accel.x,
      accelY: this.accel.y
    }
  }
  
  setData(_data) {
    super.setData(_data);
    this.pickupType = _data.pickupType !== undefined ? _data.pickupType : this.pickupType;
    this.worth = _data.worth !== undefined ? _data.worth : this.worth;
    this.collectedBy = _data.collectedBy !== undefined ? _data.collectedBy : this.collectedBy;
    this.accelTowards = _data.accelTowards !== undefined ? _data.accelTowards : this.accelTowards;
    return this;
  }
}