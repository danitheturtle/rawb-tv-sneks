import { Spritesheet } from './spritesheet';
import { Background } from './background';
let s, sg, si, sv;

export const init = (_state) => {
  s = _state;
  sg = s.game;
  si = s.image;
  sv = s.view;

  //load assets
  si.tilesheetNames.forEach(sheetName => {
    si.tilesheets[sheetName] = new Spritesheet(s, './assets/spritesheets/' + sheetName + '.json');
    sg.loading.push(si.tilesheets[sheetName].load());
  });
  si.spritesheetNames.forEach(sheetName => {
    si.spritesheets[sheetName] = new Spritesheet(s, './assets/spritesheets/' + sheetName + '.json');
    sg.loading.push(si.spritesheets[sheetName].load());
  });

  si.tutorialImg = new Background('tutorial.png');
  sg.loading.push(si.tutorialImg.load());
}

export const start = () => {}

export const draw = () => {
  //draw backgrounds
  for (const bID in si.backgrounds) {
    const back = si.backgrounds[bID];
    const dx = sv.active.xMin() * back.parallaxSpeed[0];
    const dy = sv.active.yMin() * back.parallaxSpeed[1];
    const dHeight = 75 * sg.gu;
    const dWidth = dHeight * back.whRatio;
    s.ctx.drawImage(back.img, dx, dy, dWidth, dHeight);
  }
  //draw tilesheets
  for (let l = 0; l < layers.length; l++) {
    //Loop through the data
    for (let i = 0; i < layers[l].data.length; i++) {
      let x = i % layers[l].width;;
      let y = Math.floor(i / layers[l].width);
      x *= sg.gu;
      y *= sg.gu;
      //Tile source bounds
      let tileID = layers[l].data[i];
      if (tileID == 0) {
        continue;
      }
      let sheet = getSheet(tileID);
      if (sheet == undefined) {
        continue;
      }
      let tile = sheet.tile(tileID);

      //Destination bounds
      let dWidth = sg.gu;
      let dHeight = sg.gu;

      if (x > sv.active.xMax() || y > sv.active.yMax() || x + dWidth < sv.active.xMin() || y + dHeight < sv.active.yMin()) {
        continue;
      }

      let destPos = sv.active.getObjectRelativePosition({
        x: x,
        y: y
      }, false);

      c.drawImage(
        sheet.img,
        tile.x,
        tile.y,
        tile.width,
        tile.height,
        Math.round(destPos.x),
        Math.round(destPos.y),
        dWidth,
        dHeight
      );
    }
  }
  //draw game objects
  for (const go in sp.gameObjects) {
    go.draw();
  }
}

export const createTileLayer = (layerData) => {
  layers.push(layerData);
}

export const getSheet = (tileID) => {
  for (const sid in si.tilesheets) {
    if (tileID - si.tilesheets[sid].tileStart < si.tilesheets[sid].tileCount) {
      return si.tilesheets[sid];
    }
  }
  return undefined;
}

export const drawText = (string, x, y, css, color, textAlign = "center", textBaseline = "middle") => {
  let c = s.ctx;
  c.save();
  c.font = css;
  c.fillStyle = color;
  c.textAlign = textAlign;
  c.textBaseline = textBaseline;
  c.fillText(string, x, y);
  c.restore();
}

export const drawShadowText = (
  string, 
  x, 
  y, 
  css, 
  shadowColor, 
  textColor, 
  offsetX = 5, 
  offsetY = 5, 
  textAlign = "center",
  textBaseline = "middle"
) => {
  //Draw shadow
  drawText(string, x + offsetX, y + offsetY, css, shadowColor, textAlign, textBaseline);
  //Draw text
  drawText(string, x, y, css, textColor, textAlign, textBaseline);
}

export const drawTextOutline = (
  string, 
  x, 
  y, 
  css, 
  color, 
  outlineColor, 
  lineWidth = 3, 
  textAlign = "center", 
  textBaseline = "middle"
) => {
  let c = s.ctx;
  c.save();
  c.font = css;
  c.fillStyle = color;
  c.strokeStyle = outlineColor;
  c.lineWidth = lineWidth;
  c.textAlign = textAlign;
  c.textBaseline = textBaseline;
  c.fillText(string, x, y);
  c.strokeText(string, x, y);
  c.restore();
}

export const drawProgressBar = (x, y, width, height, backColor, frontColor, val, minVal, maxVal) => {
  let c = s.ctx;
  c.save();
  c.fillStyle = backColor;
  c.fillRect(x, y, width, height);
  c.fillStyle = frontColor;
  let frontWidth = a.utils.map(val, minVal, maxVal, 0, width);
  c.fillRect(x, y, frontWidth, height);
  c.restore();
}