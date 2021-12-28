import Victor from 'victor';
import { GameObject, CircleCollider } from './physics';
const Vector = Victor;

export class Pickup extends GameObject {
  constructor() {
    super();
    this.pickupType = "regularCheese";
    this.worth = 1;
    this.collectedBy = undefined;
  }
  
  getData() {
    return {
      ...super.getData(),
      pickupType: this.pickupType,
      worth: this.worth,
      collectedBy: this.collectedBy
    }
  }
  
  setData(_data) {
    super.setData(_data);
    this.pickupType = _data.pickupType !== undefined ? _data.pickupType : this.pickupType;
    this.worth = _data.worth !== undefined ? _data.worth : this.worth;
    this.collectedBy = _data.collectedBy !== undefined ? _data.collectedBy : this.collectedBy;
    return this;
  }
}