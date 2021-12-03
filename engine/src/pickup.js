import Victor from 'victor';
import { GameObject, CircleCollider } from './physicsObjects';
const Vector = Victor;

export class Pickup extends GameObject {
  constructor(_gameStateRef) {
    super(_gameStateRef);
    this.worth = 1;
    this.collectedBy = undefined;
  }
  
  getData() {
    return {
      ...super.getData(),
      worth: this.worth,
      collectedBy: this.collectedBy
    }
  }
  
  setData(_data) {
    super.setData(_data);
    this.worth = _data.worth !== undefined ? _data.worth : this.worth;
    this.collectedBy = _data.collectedBy !== undefined ? _data.collectedBy : this.collectedBy;
    return this;
  }
}