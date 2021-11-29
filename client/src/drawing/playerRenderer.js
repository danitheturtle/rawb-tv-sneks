
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
    if (!this.parent) return;
    const c = s.ctx;
    const playerPos = sv.active?.getObjectRelativePosition(this.parent, true);
    c.save();
    c.fillStyle = 'red';
    c.beginPath();
    c.arc(playerPos.x, playerPos.y, this.radius * sg.gu, 0, 2*Math.PI);
    c.fill()
    c.restore();
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