import engine from 'engine';
import Victor from 'victor';
const Vector = Victor;
const { PICKUP_NAMES, GLOBALS } = engine;

// export class SpriteRenderer {
//   constructor() {
//     this.radius = 2;
//     this.spriteName = undefined;
//     this.parent = undefined;
//   }
//   getData() {
//     return {
//       radius: this.radius,
//       spriteName: this.spriteName
//     };
//   }
//   setData(_data, _parent) {
//     this.radius = _data.radius !== undefined ? _data.radius : this.radius;
//     this.spriteName = _data.spriteName || _parent.spriteName || this.spriteName;
//     this.parent = _parent !== undefined ? _parent : this.parent;
//     return this;
//   }
// }


export const drawPickup = (s, pickup) => {
  let sg = s.game;
  let si = s.image;
  let sv = s.view;
  if (!sv.active.isInViewXY(pickup.x, pickup.y, true)) return;
  const c = s.ctx;
  const viewPos = sv.active.getObjectRelativePosition(s, pickup, true);
  c.save();
  // console.log(si.sprites[pickup.pickupType]);
  const name = PICKUP_NAMES[pickup.pickupType] || PICKUP_NAMES[0];
  let spr = si.sprites[name];
  // console.log(spr);
  if (spr) {
    spr.draw(
      s,
      c,
      viewPos.x - GLOBALS.pickupRadius * sg.gu,
      viewPos.y - GLOBALS.pickupRadius * sg.gu,
      GLOBALS.pickupRadius * sg.gu * 2,
      GLOBALS.pickupRadius * sg.gu * 2
    );
  }
  c.restore();
}
