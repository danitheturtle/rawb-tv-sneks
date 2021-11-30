import Victor from 'victor';
const Vector = Victor;
let s, spl, sg, sv;
export const init = (_state) => {
  s = _state;
  sg = s.game;
  spl = s.player;
  sv = s.view;
}
export class PlayerRenderer {
  constructor(_radius) {
    this.radius = _radius;
    this.parent = undefined;
  }
  draw() {
    if (!this.parent || !this.parent?.collider) return;
    const c = s.ctx;
    const snakeBodyRelativePositions = Object.entries(this.parent.collider.parts)
      .sort(([ind1], [ind2]) => ind1 > ind2 ? 1 : -1)
      .map(([index, partPos]) => sv.active?.getObjectRelativePosition(new Vector(partPos[0], partPos[1]), true));
    snakeBodyRelativePositions.forEach(pos => {
      c.save();
      c.fillStyle = 'red';
      c.beginPath();
      c.arc(pos.x, pos.y, this.radius * sg.gu, 0, 2*Math.PI);
      c.fill()
      c.restore();
    })
  }
  getData() {
    return {
      radius: this.radius
    };
  }
  setData(_data, _parent) {
    this.radius = _data.radius;
    this.parent = _parent;
  }
}