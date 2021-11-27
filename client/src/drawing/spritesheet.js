import { Sprite } from './sprite';

export class Spritesheet {
  constructor(_stateRef, _jsonFilepath) {
    this.stateRef = _stateRef;
    //Is the spritesheet ready?
    this.ready = false;
    this.img = undefined;
    this.name = "";
    this.tileWidth = 0;
    this.tileHeight = 0;
    this.spacing = 0;
    this.tileCount = 0;
    this.columns = 0;
    this.jsonFilepath = _jsonFilepath;

    //Sprite data (if any) from this sheet
    this.sprites = undefined;

    //This will be used as the starting index for tiles in this sheet.
    this.tileStart;

    //Cached data about tiles
    this.tiles = {};
  }

  load() {
    let sheet = this;
    //Return a promise that resolves once the spritesheet has been fully loaded
    return new Promise(async (res, rej) => {
      try {
        let sheetData = await import(/* webpackMode: "eager" */'./assets/spritesheets/core_spritesheet.json');
        console.dir(sheetData);
        //Store sheet data in the object
        sheet.name = sheetData.name;
        sheet.tileWidth = sheetData.tileWidth;
        sheet.tileHeight = sheetData.tileHeight;
        sheet.spacing = sheetData.spacing;
        sheet.tileCount = sheetData.tileCount;
        sheet.columns = sheetData.columns;

        if (sheetData.sprites) {
          sheet.sprites = sheetData.sprites;
        }

        //Load the Image
        sheet.img = await import(sheetData.spritesheet)
        //Set the sheet to ready
        sheet.ready = true;
        //Pre-cache tile coordinates
        sheet.cacheTiles();
        sheet.makeSprites();
        //Resolve the promise once loaded
        res(sheet);
      } catch (e) {
        rej(e);
      }
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
        this.stateRef.image.sprites[spr] = new Sprite(spr, this, this.sprites[spr]);
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
