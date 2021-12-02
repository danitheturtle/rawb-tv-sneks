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
export class SpriteRenderer {
  constructor(_radius, _spriteName) {
    this.radius = _radius;
    this.spriteName = _spriteName;
    this.parent = undefined;
  }
  draw() {
    if (!this.parent || !this.parent?.collider) return;
    if (!sv.active.isInView(this.parent, true)) return;
    const c = s.ctx;
    const viewPos = sv.active.getObjectRelativePosition(this.parent, true);
    c.save();
    if (si.sprites[this.spriteName]) {
      si.sprites[this.spriteName].draw(
        s, 
        c, 
        viewPos.x - this.radius * sg.gu, 
        viewPos.y - this.radius * sg.gu, 
        this.radius * sg.gu * 2, 
        this.radius * sg.gu * 2
      );
    }
    c.restore();
  }
  getData() {
    return {
      radius: this.radius,
      spriteName: this.spriteName
    };
  }
  setData(_data, _parent) {
    this.radius = _data.radius;
    this.spriteName = _data.spriteName;
    this.parent = _parent;
  }
}