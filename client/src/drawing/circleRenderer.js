import Victor from 'victor';
const Vector = Victor;
let s, spl, sg, sv;
export const init = (_state) => {
  s = _state;
  sg = s.game;
  spl = s.player;
  sv = s.view;
}
export class CircleRenderer {
  constructor() {
    this.radius = 2;
    this.color = undefined;
    this.parent = undefined;
  }
  draw() {
    if (!this.parent || !this.parent?.collider) return;
    const c = s.ctx;
    const viewPos = sv.active.getObjectRelativePosition(this.parent, true);
    c.save();
    c.fillStyle = this.color;
    c.beginPath();
    c.arc(viewPos.x, viewPos.y, this.radius * sg.gu, 0, 2*Math.PI);
    c.fill()
    c.restore();
  }
  getData() {
    return {
      radius: this.radius,
      color: this.color
    };
  }
  setData(_data, _parent) {
    this.radius = _data.radius !== undefined ? _data.radius : this.radius;
    this.color = _data.color !== undefined ? _data.color : this.color;
    this.parent = _parent !== undefined ? _parent : this.parent;
  }
}