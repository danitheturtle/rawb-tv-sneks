import { Sprite } from './sprite';

export class Spritesheet {
  constructor(_stateRef, _imageSrc, _stylesheetData) {
    this.stateRef = _stateRef;
    //Is the spritesheet ready?
    this.ready = false;
    this.src = _imageSrc;
    this.image = undefined;
    this.name = _stylesheetData.name;
    this.tileWidth = _stylesheetData.tileWidth;
    this.tileHeight = _stylesheetData.tileHeight;
    this.spacing = _stylesheetData.spacing;
    this.tileCount = _stylesheetData.tileCount;
    this.columns = _stylesheetData.columns;
    this.animationSpeed = _stylesheetData.animationSpeed;
    if (_stylesheetData.sprites) {
      this.sprites = _stylesheetData.sprites;
    } else {
      this.sprites = undefined;
    }

    //This will be used as the starting index for tiles in this sheet.
    this.tileStart;

    //Cached data about tiles
    this.tiles = {};
  }
  
  load() {
    return new Promise((res, rej) => {
      try {
        this.image = new Image();
        this.image.onload = () => {
          this.ready = true;
          this.cacheTiles();
          this.makeSprites();
          res(this);
        }
        this.image.src = this.src;
      } catch (e) {
        rej(e);
      }
    }).catch(err => {
      console.err(err);
    });
  }
  
  cacheTiles() {
    for (let t = 0; t < this.tileCount; t++) {
      let tileID = t;
      //X and Y position on the spritesheet
      let x = tileID % (this.columns);
      let y = Math.floor(tileID / this.columns);
      //Add in spacing and account for other tiles
      x = x * (this.tileWidth + this.spacing);
      y = y * (this.tileHeight + this.spacing);
      //Store the tile as an object
      this.tiles[tileID] = {
        x: x,
        y: y,
        width: this.tileWidth,
        height: this.tileHeight
      }
    }
  }

  makeSprites() {
    if (this.sprites) {
      for (const spr in this.sprites) {
        this.stateRef.image.sprites[spr] = new Sprite(spr, this, this.sprites[spr], this.animationSpeed);
      }
    }
  }

  setStart(startIndex) {
    this.tileStart = startIndex;
  }

  tile(id) {
    return this.tiles[id - this.tileStart];
  }
}
