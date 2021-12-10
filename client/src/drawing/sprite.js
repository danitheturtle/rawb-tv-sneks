import engine from 'engine';

export class Sprite {
  constructor(_name, _sheet, _frameArray, _animSpeed = 0.05) {
    this.name = _name;
    this.tilesheet = _sheet;
    //Animation
    this.animSpeed = _animSpeed;
    this.frameArray = _frameArray;
  }

  draw(s, ctx, dx, dy, dWidth, dHeight) {
    let drawIndex = Math.floor(s.runTime/this.animSpeed)%this.frameArray.length;
    let tile = this.tilesheet.tiles[this.frameArray[drawIndex]];
    ctx.drawImage(this.tilesheet.image, tile.x, tile.y, tile.width, tile.height, dx, dy, dWidth, dHeight);
  }
}
