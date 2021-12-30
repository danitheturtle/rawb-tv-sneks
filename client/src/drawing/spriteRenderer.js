import Victor from 'victor';
const Vector = Victor;

export class SpriteRenderer {
  constructor() {
    this.radius = 2;
    this.spriteName = undefined;
    this.parent = undefined;
  }
  draw(_state) {
    const s = _state;
    const sg = s.game;
    const sv = s.view;
    const si = s.image;
    if (!this.parent || !this.parent?.collider) return;
    if (!sv.active.isInView(this.parent, true)) return;
    const c = s.ctx;
    const viewPos = sv.active.getObjectRelativePosition(s, this.parent, true);
    c.save();
    if (si.sprites[this.spriteName]) {
      si.sprites[this.spriteName].draw(
        s, 
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
    this.radius = _data.radius !== undefined ? _data.radius : this.radius;
    this.spriteName = _data.spriteName || _parent.spriteName || this.spriteName;
    this.parent = _parent !== undefined ? _parent : this.parent;
    return this;
  }
}