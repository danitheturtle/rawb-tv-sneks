import engine from 'engine';
const { time } = engine;

export class Sprite {
  constructor(_name, _sheet, _frameArray, _animSpeed = 0.05) {
    this.name = _name;
    this.tilesheet = _sheet;
    //Animation
    this.animSpeed = _animSpeed;
    this.frameArray = _frameArray;

    //Start a timer
    time.startNewTimer(this.name);
  }
  
  draw(state, ctx, dx, dy, dWidth, dHeight) {
    let drawIndex = Math.floor(state.time.timers[this.name] / this.animSpeed);
    if (drawIndex > this.frameArray.length - 1) {
      drawIndex = 0;
      time.startNewTimer(this.name);
    }
    let tile = this.tilesheet.tiles[this.frameArray[drawIndex]];
    ctx.drawImage(this.tilesheet.image, tile.x, tile.y, tile.width, tile.height, dx, dy, dWidth, dHeight);
  }
}
