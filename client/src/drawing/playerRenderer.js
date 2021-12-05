import Victor from 'victor';
import { drawTextOutline } from './index';
const Vector = Victor;
let s, spl, sg, sv, si;
export const init = (_state) => {
  s = _state;
  sg = s.game;
  spl = s.player;
  sv = s.view;
  si = s.image;
}
export class PlayerRenderer {
  constructor() {
    this.radius = 2.66;
    this.playerName = undefined;
    this.spriteName = undefined;
    this.parent = undefined;
    this.parts = [];
  }
  draw() {
    if (!this.parent || !this.parent?.collider) return;
    //update radius based on length
    this.radius = this.parent.collider.radius * 1.33;
    
    //Update parts path
    if (!!this.parts[0]) {
      this.parts[0].x = this.parent.pos.x;
      this.parts[0].y = this.parent.pos.y;
    } else {
      this.parts[0] = new Vector(this.parent.pos.x, this.parent.pos.y);
    }
    const scaledRadiusDist = this.radius * this.parent.bodySpacing;
    const lastPointToPlayerPos = this.parent.pos.clone().subtract(this.parent.collider.pointPath[0]);
    const partDistFromNextPoint = Math.max(scaledRadiusDist - lastPointToPlayerPos.length(), 0);
    for (let i = 0; i < this.bodyPartCount - 1; i++) {
      const thisPathPoint = i > this.pointPath.length - 1 ?
        this.pointPath[this.pointPath.length - 1] :
        this.pointPath[i]
      const nextPathPoint = i + 1 > this.pointPath.length - 1 ?
        this.pointPath[this.pointPath.length - 1] :
        this.pointPath[i + 1];

      const partLocation = partDistFromNextPoint !== 0 ?
        nextPathPoint.clone()
        .subtract(thisPathPoint)
        .normalize()
        .multiplyScalar(partDistFromNextPoint)
        .add(thisPathPoint) :
        nextPathPoint.clone();

      if (!!this.parts[i + 1]) {
        this.parts[i + 1].x = partLocation.x;
        this.parts[i + 1].y = partLocation.y;
      } else {
        this.parts[i + 1] = new Vector(partLocation.x, partLocation.y);
      }
    }
    
    //Grab player sprites
    const playerHead = si.sprites[`${this.spriteName}Head`];
    const playerBody = si.sprites[`${this.spriteName}Body`];
    const c = s.ctx;
    const snakeBodyRelativePositions = this.parent.collider.parts
      .map(partPos => sv.active?.getObjectRelativePosition(partPos, true));
    for (let i=snakeBodyRelativePositions.length-1; i>=0; i--) {
      const pos = snakeBodyRelativePositions[i];
      c.save();
      if (i === 0) {
        c.translate(pos.x, pos.y);
        drawTextOutline(
          this.playerName, 
          0, 
          -1*(2.5+this.parent.collider.radius)*sg.gu, 
          `${(1.5*sg.gu)+4}px Arial`, 
          "rgb(255, 255, 255)", 
          "rgb(30, 30, 30)",
          0.75
        );
        c.rotate(this.parent.vel.horizontalAngle()+Math.PI/2);
        playerHead.draw(
          s, 
          c, 
          -this.radius * sg.gu, 
          -this.radius * sg.gu, 
          this.radius * sg.gu * 2, 
          this.radius * sg.gu * 2
        );
      } else {
        c.translate(pos.x, pos.y);
        c.rotate(snakeBodyRelativePositions[i-1].clone().subtract(pos).horizontalAngle()+Math.PI/2);
        playerBody.draw(
          s, 
          c, 
          -this.radius * sg.gu, 
          -this.radius * sg.gu, 
          this.radius * sg.gu * 2, 
          this.radius * sg.gu * 2
        );
      }
      c.restore();
    }
  }
  getData() {
    return {
      radius: this.radius,
      playerName: this.playerName,
      spriteName: this.spriteName,
      parts: this.parts.map(p => ([p.x, p.y]))
    };
  }
  
  getDataForNetworkUpdate() {
    return {}
  }
  
  setData(_data, _parent) {
    this.radius = _data.radius !== undefined ? _data.radius : this.radius;
    this.parent = _parent !== undefined ? _parent : this.parent;
    this.playerName = _data.playerName || _parent.name || this.playerName;
    this.spriteName = _data.spriteName || _parent.spriteName || this.spriteName;
    this.parts = _data.parts !== undefined ? _data.parts.map(p => (new Vector(p[0], p[1]))) : this.parts;
    return this;
  }
}