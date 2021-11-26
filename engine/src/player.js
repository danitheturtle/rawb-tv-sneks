import Victor from 'victor';
import { GameObject } from './physicsObjects';
const Vector = Victor;

export class Player extends GameObject {
  constructor(_gameStateRef, _clientId, _pos, _collider, _vel, _accel) {
    super(_gameStateRef, _pos, _collider, _vel, _accel)
    //Store their ID
    this.clientId = _clientId;
    //Create a rigid body for the player
    this.gameObject = physics.getGameObject(_x, _y, 1, 1.3158);

    //Player input tracking.  Everything is false by default
    this.moveLeft = false;
    this.moveRight = false;
    this.sprint = false;
  }

  update() {
    super.update();
    const sp = gameStateRef.physics;
    //Set the hor velocity to zero
    this.vel.x = 0;
    //If moving left, move left
    if (this.moveLeft) {
      this.vel.add(new Vector(this.sprint ?
        sp.moveSpeed * sp.sprintMult :
        sp.moveSpeed, 0.0));
    }
    //If moving right, move right
    if (this.moveRight) {
      this.vel.add(new Vector(this.sprint ?
        sp.moveSpeed * sp.sprintMult :
        sp.moveSpeed, 0.0));
    }
  }
  
  getData() {
    return {
      ...super.getData(),
      time: st.clientTimers[this.id],
      moveLeft: this.moveLeft,
      moveRight: this.moveRight,
      sprint: this.sprint
    };
  }

  setData(data) {
    super.setData(data);
    this.moveLeft = data.moveLeft;
    this.moveRight = data.moveRight;
    this.sprint = data.sprint;
    let timer = this.gameStateRef.time.clientTimers[data.id];
    this.gameObject.setData(data.gameObject, timer - data.time);
    this.gameStateRef.time.clientTimers[data.id] = data.time;
  }
}
