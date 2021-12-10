import Victor from 'victor';
const Vector = Victor;

export class CircleRenderer {
  constructor() {
    this.radius = 2;
    this.color = undefined;
    this.parent = undefined;
  }
  draw(s) {
    if (!this.parent || !this.parent?.collider) return;
    const c = s.ctx;
    const viewPos = sv.active.getObjectRelativePosition(s, this.parent, true);
    c.save();
    c.fillStyle = this.color;
    c.beginPath();
    c.arc(viewPos.x, viewPos.y, this.radius * sg.gu, 0, 2*Math.PI);
    c.fill()
    c.restore();
  }
}
