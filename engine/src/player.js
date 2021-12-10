import Victor from 'victor';
import { randomVec, randomInt, norm, lerp, clamp } from './utils';
import { GLOBALS } from './state';
const Vector = Victor;

export class Player {
  constructor() {
    //General
    this.pos = new Vector(0,0);
    this.vel = new Vector(0,0);

    //Snake body
    this.radius = GLOBALS.initialSnakeRadius;
    this.bodyPartCount = GLOBALS.initialSnakeSize;
    this.pointPathX = [];
    this.pointPathY = [];

    this.dead = false;

    //Player input tracking.  Everything is false/blank by default
    this.moveHeading = randomVec();
    this.sprint = false;
    this.sprintTimer = undefined;

    //snake data
    // this.bodySpacing = 1.8;

    //Player sprite
    this.spriteName = undefined;
    this.playerName = undefined;

    //Score
    this.score = 0;

  }

  update(s, dt) {
    if (!this.dead) {
      //Rotate towards heading, clamp degrees so you can't turn around on the spot
      let accel = this.vel.clone().normalize();
      const angleDiff = (180+this.moveHeading.angleDeg()) - (180+accel.angleDeg());
      const angleDir = angleDiff > 0 ? 1 : -1;
      const clampedDegToRotate = clamp(Math.abs(angleDiff), 0, 90)*(Math.abs(angleDiff) > 180 ? -angleDir : angleDir);
      accel.rotateDeg(clampedDegToRotate).multiplyScalar(GLOBALS.baseAccelSpeed);
      //Add acceleration to the velocity scaled by dt.  Limit the velocity so collisions don't break
      this.vel.add(accel.multiplyScalar(dt));
      //limit velocity with current max speed (squared since its cheaper)
      const currentMaxSpeed = this.sprint && this.pointPathX.length > 5 ?
        GLOBALS.sprintMult * GLOBALS.sprintMult * GLOBALS.baseMoveSpeed * GLOBALS.baseMoveSpeed :
        GLOBALS.baseMoveSpeed * GLOBALS.baseMoveSpeed;
      if (this.vel.lengthSq() > currentMaxSpeed) {
        this.vel.normalize().multiplyScalar(this.sprint && this.pointPathX.length > 5 ? GLOBALS.baseMoveSpeed * GLOBALS.sprintMult : GLOBALS.baseMoveSpeed);
      }
      //Add velocity to the position scaled by dt
      this.pos.add(this.vel.clone().multiplyScalar(dt));

      //Sprint decreases snake length. If snake is too short, stop sprinting
      if (this.sprint) {
        if (this.sprintTimer === undefined) {
          this.sprintTimer = s.runTime;
        }
        let secsPerCost = 1.0/GLOBALS.sprintCostPerSecond;
        if ((s.runTime - this.sprintTimer) > secsPerCost && this.score > 0) {
          this.sprintTimer += secsPerCost;
          this.score -= 1;
          this.updateBodyWithScore();
        }
      } else {
        this.sprintTimer = undefined;
      }

      if(this.pointPathX.length > 0) {
        const scaledRadiusDist = GLOBALS.snakeBodySpacing;
        const lastPointToPlayerPos = this.pos.clone().subtract(new Vector(this.pointPathX[0], this.pointPathY[0]));
        const distToLastPoint = lastPointToPlayerPos.length();
        if (distToLastPoint >= scaledRadiusDist) {
          let px = this.pointPathX[0] + lastPointToPlayerPos.x/distToLastPoint*scaledRadiusDist;
          let py = this.pointPathY[0] + lastPointToPlayerPos.y/distToLastPoint*scaledRadiusDist;
          this.pointPathX.unshift(px);
          this.pointPathY.unshift(py);
          if (this.pointPathX.length > this.bodyPartCount) {
            this.pointPathX.length = this.bodyPartCount;
            this.pointPathY.length = this.bodyPartCount;
          }
        }
      } else {
        this.pointPathX.unshift(this.pos.x);
        this.pointPathY.unshift(this.pos.y);
      }
    }
  }

  updateBodyWithScore() {
    const newBodyPartCount = GLOBALS.initialSnakeSize + Math.floor(this.score/GLOBALS.scoreLengthDivider);

    if (newBodyPartCount !== this.bodyPartCount) {
      this.bodyPartCount = newBodyPartCount;

      if (this.pointPathX.length > newBodyPartCount) {
        this.pointPathX.length = newBodyPartCount;
      }
      this.radius = GLOBALS.initialSnakeRadius + Math.min(this.bodyPartCount / 100, 8);
    }
  }

  checkCollisionWithPickup(_pickup) {
    const r = this.radius + GLOBALS.pickupRadius;
    const dx = this.pos.x - _pickup.x;
    const dy = this.pos.y - _pickup.y;
    return dx*dx + dy*dy < r*r;
  }

  checkCollisionWithOtherSnake(_other) {
    //returns 0 if no collision, 1 if other's head collided with this' body, 2 if this' head collided with other's body, or 3 if other's head collided with this' head

    //for the sake of game feel we will intentionally not check collision for the last element of pointPath
    const headX0 = this.pos.x;
    const headX1 = _other.pos.x;
    const headY0 = this.pos.y;
    const headY1 = _other.pos.y;
    const radius0 = this.radius;
    const radius1 = _other.radius;
    const r = radius0 + radius1;
    const r2 = r*r;
    const pathX0 = this.pointPathX;
    const pathY0 = this.pointPathY;
    const pathX1 = _other.pointPathX;
    const pathY1 = _other.pointPathY;
    const dx = headX0 - headX1;
    const dy = headY0 - headY1;
    if(dx*dx + dy*dy < r2) {//1 head collide with 0 head
      return 3
    }
    for (let i = 0; i < pathX1.length - 1; i++) {//0 head collide with 1 body
      const dx = pathX1[i] - headX0;
      const dy = pathY1[i] - headY0;
      if (dx*dx + dy*dy < r2) {
        return 2;
      }
    }
    for (let i = 0; i < pathX0.length - 1; i++) {//1 head collide with 0 body
      const dx = pathX0[i] - headX1;
      const dy = pathY0[i] - headY1;
      if (dx*dx + dy*dy < r2) {
        return 1;
      }
    }

    return 0;
  }

  isOutOfBounds(s) {
    const xMin = this.pos.x - this.radius;
    const yMin = this.pos.y - this.radius;
    const xMax = this.pos.x + this.radius;
    const yMax = this.pos.y + this.radius;
    if (
      xMin < 0 ||
      yMin < 0 ||
      xMax > s.game?.activeLevelData.guWidth ||
      yMax > s.game?.activeLevelData.guHeight
    ) {
      return true;
    } else {
      return false;
    }
  }




  getForRespawnFromServer(id) {
    return {
      id: id,
      playerName: this.playerName,
      spriteName: this.spriteName,
      posX: this.pos.x,
      posY: this.pos.y,
      velX: this.vel.x,
      velY: this.vel.y,
      moveHeadingX: this.moveHeading.x,
      moveHeadingY: this.moveHeading.y,
      sprint: this.sprint,
    }
  }

  respawnFromServer(_data) {//NOTE: this should probably check that the types of things make sense
    this.playerName = _data.playerName !== undefined ? _data.playerName : this.playerName;
    this.spriteName = _data.spriteName !== undefined ? _data.spriteName : this.spriteName;
    this.dead = false;
    this.pointPathX = [];
    this.pointPathY = [];

    this.pos.x = !isNaN(_data.posX) ? _data.posX : this.pos.x;
    this.pos.y = !isNaN(_data.posY) ? _data.posY : this.pos.y;
    this.vel.x = !isNaN(_data.velX) ? _data.velX : this.vel.x;
    this.vel.y = !isNaN(_data.velY) ? _data.velY : this.vel.y;
    this.moveHeading.x = !isNaN(_data.moveHeadingX) ? _data.moveHeadingX : this.moveHeading.x;
    this.moveHeading.y = !isNaN(_data.moveHeadingY) ? _data.moveHeadingY : this.moveHeading.y;

    this.sprint = _data.sprint !== undefined ? _data.sprint : this.sprint;
    this.score = 0;
    this.updateBodyWithScore();
  }

  getForSetFromServer(id) {
    return {
      id: id,
      playerName: this.playerName,
      spriteName: this.spriteName,
      dead: this.dead,
      posX: this.pos.x,
      posY: this.pos.y,
      velX: this.vel.x,
      velY: this.vel.y,
      moveHeadingX: this.moveHeading.x,
      moveHeadingY: this.moveHeading.y,
      pointPathX: this.pointPathX,
      pointPathY: this.pointPathY,
      sprint: this.sprint,
      score: this.score
    }
  }

  setFromServer(_data) {//NOTE: this should probably check that the types of things make sense
    this.playerName = _data.playerName !== undefined ? _data.playerName : this.playerName;
    this.spriteName = _data.spriteName !== undefined ? _data.spriteName : this.spriteName;
    this.dead = _data.dead !== undefined ? _data.dead : this.dead;

    this.pos.x = !isNaN(_data.posX) ? _data.posX : this.pos.x;
    this.pos.y = !isNaN(_data.posY) ? _data.posY : this.pos.y;
    this.vel.x = !isNaN(_data.velX) ? _data.velX : this.vel.x;
    this.vel.y = !isNaN(_data.velY) ? _data.velY : this.vel.y;
    this.moveHeading.x = !isNaN(_data.moveHeadingX) ? _data.moveHeadingX : this.moveHeading.x;
    this.moveHeading.y = !isNaN(_data.moveHeadingY) ? _data.moveHeadingY : this.moveHeading.y;

    this.pointPathX = _data.pointPathX !== undefined ? _data.pointPathX : this.pointPathX;
    this.pointPathY = _data.pointPathY !== undefined ? _data.pointPathY : this.pointPathY;

    this.sprint = _data.sprint !== undefined ? _data.sprint : this.sprint;
    if (_data.score !== undefined && _data.score !== this.score) {
      this.score = _data.score;
      this.updateBodyWithScore();
    }
  }

  getForUpdateFromServer(id) {
    return {
      id: id,
      posX: this.pos.x,
      posY: this.pos.y,
      velX: this.vel.x,
      velY: this.vel.y,
      moveHeadingX: this.moveHeading.x,
      moveHeadingY: this.moveHeading.y,
      sprint: this.sprint,
    }
  }

  updateFromServer(_data) {//NOTE: this should probably check that the types of things make sense
    this.pos.x = !isNaN(_data.posX) ? _data.posX : this.pos.x;
    this.pos.y = !isNaN(_data.posY) ? _data.posY : this.pos.y;
    this.vel.x = !isNaN(_data.velX) ? _data.velX : this.vel.x;
    this.vel.y = !isNaN(_data.velY) ? _data.velY : this.vel.y;
    this.moveHeading.x = !isNaN(_data.moveHeadingX) ? _data.moveHeadingX : this.moveHeading.x;
    this.moveHeading.y = !isNaN(_data.moveHeadingY) ? _data.moveHeadingY : this.moveHeading.y;

    this.sprint = _data.sprint !== undefined ? _data.sprint : this.sprint;
  }


  getForUpdateFromClient() {
    return {
      posX: this.pos.x,
      posY: this.pos.y,
      // velX: this.vel.x,
      // velY: this.vel.y,
      moveHeadingX: this.moveHeading.x,
      moveHeadingY: this.moveHeading.y,
      sprint: this.sprint,
    }
  }

  updateFromClient(_data) {//NOTE: this should probably check that the types of things make sense
    this.pos.x = !isNaN(_data.posX) ? _data.posX : this.pos.x;
    this.pos.y = !isNaN(_data.posY) ? _data.posY : this.pos.y;
    // this.vel.x = !isNaN(_data.velX) ? _data.velX : this.vel.x;
    // this.vel.y = !isNaN(_data.velY) ? _data.velY : this.vel.y;
    this.moveHeading.x = !isNaN(_data.moveHeadingX) ? _data.moveHeadingX : this.moveHeading.x;
    this.moveHeading.y = !isNaN(_data.moveHeadingY) ? _data.moveHeadingY : this.moveHeading.y;

    this.sprint = _data.sprint !== undefined ? _data.sprint : this.sprint;
  }
}
