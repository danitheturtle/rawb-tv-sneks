import Victor from 'victor';
import { drawTextOutline } from './index';
const Vector = Victor;

export class PlayerRenderer {
  constructor() {
    this.radius = 2.66;
    this.playerName = undefined;
    this.spriteName = undefined;
    this.parent = undefined;
    this.parts = [];
  }
  draw(_state) {
    const s = _state;
    const sg = s.game;
    const sv = s.view;
    const si = s.image;
    if (!this.parent || !this.parent?.collider) return;
    //update radius based on length
    this.radius = this.parent.collider.radius * 1.33;

    if (!!this.parts[0]) {
      this.parts[0].x = this.parent.pos.x;
      this.parts[0].y = this.parent.pos.y;
    } else {
      this.parts[0] = new Vector(this.parent.pos.x, this.parent.pos.y);
    }
    const lastPointToPlayerPos = this.parent.pos.clone().subtract(this.parent.collider.pointPath[0]);
    const scaledRadiusDist = this.parent.collider.initialRadius * this.parent.bodySpacing;
    const partDistFromNextPoint = Math.max(scaledRadiusDist - lastPointToPlayerPos.length(), 0);
    const colliderRef = this.parent.collider;
    for (let i = 0; i < colliderRef.bodyPartCount - 1; i++) {
      const thisPathPoint = i > colliderRef.pointPath.length - 1 ?
        colliderRef.pointPath[colliderRef.pointPath.length - 1] :
        colliderRef.pointPath[i]
      const nextPathPoint = i + 1 > colliderRef.pointPath.length - 1 ?
        colliderRef.pointPath[colliderRef.pointPath.length - 1] :
        colliderRef.pointPath[i + 1];

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
    const playerBodyFirst = si.sprites[`${this.spriteName}Body-first`];
    let playerBody = si.sprites[`${this.spriteName}Body`];
    //If no player body, the body is split into multiple sections
    if (!playerBody) {
      playerBody = [];
      //max of 4 sections and a "last" part currently
      for (let i = 0; i < 4; i++) {
        const nextSpriteRef = si.sprites[`${this.spriteName}Body-${i}`];
        if (nextSpriteRef) {
          playerBody.push(nextSpriteRef)
        } else {
          break;
        }
      }
    }
    const playerBodyLast = si.sprites[`${this.spriteName}Body-last`];

    const c = s.ctx;
    const snakeBodyRelativePositions = this.parts
      .map(partPos => sv.active?.getObjectRelativePosition(s, partPos, true));
    for (let i = snakeBodyRelativePositions.length - 1; i >= 0; i--) {
      const pos = snakeBodyRelativePositions[i];
      c.save();
      if (i === 0) {
        c.translate(pos.x, pos.y);
        drawTextOutline(
          s,
          this.playerName,
          0,
          -1 * (2.5 + this.parent.collider.radius) * sg.gu,
          `${(1.5*sg.gu)+4}px Arial`,
          "rgb(255, 255, 255)",
          "rgb(30, 30, 30)",
          0.75
        );
        c.rotate(this.parent.vel.horizontalAngle() + Math.PI / 2);
        playerHead.draw(
          s,
          -this.radius * sg.gu,
          -this.radius * sg.gu,
          this.radius * sg.gu * 2,
          this.radius * sg.gu * 2
        );
      } else if (i === 1 && playerBodyFirst) {
        c.translate(pos.x, pos.y);
        c.rotate(snakeBodyRelativePositions[i - 1].clone().subtract(pos).horizontalAngle() + Math.PI / 2);
        playerBodyFirst.draw(
          s,
          -this.radius * sg.gu,
          -this.radius * sg.gu,
          this.radius * sg.gu * 2,
          this.radius * sg.gu * 2
        );
      } else if (i === snakeBodyRelativePositions.length - 1 && playerBodyLast) {
        c.translate(pos.x, pos.y);
        c.rotate(snakeBodyRelativePositions[i - 1].clone().subtract(pos).horizontalAngle() + Math.PI / 2);
        playerBodyLast.draw(
          s,
          -this.radius * sg.gu,
          -this.radius * sg.gu,
          this.radius * sg.gu * 2,
          this.radius * sg.gu * 2
        );
      } else {
        c.translate(pos.x, pos.y);
        c.rotate(snakeBodyRelativePositions[i - 1].clone().subtract(pos).horizontalAngle() + Math.PI / 2);
        let selectedSprite;
        if (playerBody instanceof Array) {
          const spriteIndex = i % playerBody.length;
          selectedSprite = playerBody[spriteIndex];
        } else {
          selectedSprite = playerBody;
        }
        selectedSprite.draw(
          s,
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

  setData(_data, _parent) {
    this.radius = _data.radius !== undefined ? _data.radius : this.radius;
    this.parent = _parent !== undefined ? _parent : this.parent;
    this.playerName = _data.playerName || _parent.name || this.playerName;
    this.spriteName = _data.spriteName || _parent.spriteName || this.spriteName;
    this.parts = _data.parts !== undefined ? _data.parts.map(p => (new Vector(p[0], p[1]))) : this.parts;
    return this;
  }
}
