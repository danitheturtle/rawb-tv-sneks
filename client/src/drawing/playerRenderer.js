import Victor from 'victor';
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
    this.radius = 3;
    this.spriteName = undefined;
    this.parent = undefined;
  }
  draw() {
    if (!this.parent || !this.parent?.collider) return;
    //update radius based on length
    this.radius = this.parent.collider.radius * 1.5;
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
      spriteName: this.spriteName
    };
  }
  setData(_data, _parent) {
    this.radius = _data.radius !== undefined ? _data.radius : this.radius;
    this.parent = _parent !== undefined ? _parent : this.parent;
    this.spriteName = _data.spriteName || _parent.spriteName || this.spriteName;
    return this;
  }
}