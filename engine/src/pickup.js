import Victor from 'victor';
import { GameObject, CircleCollider } from './physicsObjects';
const Vector = Victor;

export class Pickup extends GameObject {
  constructor(_gameStateRef, _pickupId, _pos, _worth, _collider, _renderer) {
    super(_gameStateRef, _pickupId, _pos, new Vector(0.0, 0.0), new Vector(0.0,0.0), _collider, _renderer);
    this.worth = _worth;
    this.collectedBy = null;
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
    this.worth = _data.worth;
    this.collectedBy = _data.collectedBy;
  }
}