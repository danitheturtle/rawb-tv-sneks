import { Spritesheet } from './spritesheet';
import { Background } from './background';
import engine from 'engine';
import { CLIENT_STATES } from '../clientState';
import * as playerRenderer from './playerRenderer';
import * as circleRenderer from './circleRenderer';
import * as spriteRenderer from './spriteRenderer';
const { utils, GLOBALS } = engine;
let s, sg, si, sv, sp, sl;
let layers = [];

export const init = (_state) => {
  s = _state;
  sg = s.game;
  si = s.image;
  sv = s.view;
  sp = s.physics;
  sl = s.level;

  //load assets
  Object.entries(si.tilesheetAssets).forEach(([sheetName, tilesheet]) => {
    si.tilesheets[sheetName] = new Spritesheet(s, tilesheet[0], tilesheet[1]);
    sg.loading.push(si.tilesheets[sheetName].load());
  });
  Object.entries(si.spritesheetAssets).forEach(([sheetName, spritesheet]) => {
    si.spritesheets[sheetName] = new Spritesheet(s, spritesheet[0], spritesheet[1]);
    sg.loading.push(si.spritesheets[sheetName].load());
  });
  Object.entries(si.backgroundAssets).forEach(([bgName, bgFile]) => {
    si.backgrounds[bgName] = new Background(bgName, bgFile[0], bgFile[1]);
    sg.loading.push(si.backgrounds[bgName].load());
  })

  si.tutorialImg = new Background('tutorialImg', si.tutorialImg[0], si.tutorialImg[1]);
  sg.loading.push(si.tutorialImg.load());
  
  playerRenderer.init(s);
  circleRenderer.init(s);
  spriteRenderer.init(s);
}

export const start = () => {}

export const draw = () => {
  //draw background
  const backs = sl.activeBackgrounds;
  backs.forEach(back => {
    const dx = sv.active.xMin() * back.parallaxSpeed[0];
    const dy = sv.active.yMin() * back.parallaxSpeed[1];
    const dHeight = sl.activeLevelData.guWidth * sg.gu;
    const dWidth = dHeight * back.whRatio;
    s.ctx.drawImage(back.image, dx, dy, dWidth, dHeight);
  })
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
    sp.gameObjects[go].draw();
  }
}

export const drawGUI = () => {
  if (sg.clientState === CLIENT_STATES.PLAYING || sg.clientState === CLIENT_STATES.PAUSED);
  switch (sg.gameState) {
    case CLIENT_STATES.GAME_WAITING_FOR_PLAYERS:
      drawWaitingForPlayersGUI();
      break;
    case CLIENT_STATES.GAME_STARTING_SOON:
      drawStartingSoonGUI();
      break;
    case CLIENT_STATES.GAME_OVER:
      drawGameOverGUI();
      break;
    case CLIENT_STATES.GAME_RESETTING:
      drawResetGUI();
      break;
    case CLIENT_STATES.GAME_PLAYING:
    default:
      drawPlayingGUI();
      break;
  }
}

export const drawWaitingForPlayersGUI = () => {
  drawTextOutline(
    "Waitinig for Players (min 3)", 
    s.viewport.width / 2, 
    48, 
    "36px Arial", 
    'rgb(255, 255, 255)', 
    'rgb(50, 50, 50)', 
    1
  );
  Object.values(sg.players).forEach((player, i) => {
    if (i > 20) return;
    drawTextOutline("Sneks in a Lobby", 186, 48, "36px Arial", 'rgb(255, 255, 255)', 'rgb(50, 50, 50)', 1)
    drawTextOutline(player.name, 48, 96+i*32, "24px Arial", 'rgb(255, 255, 255)', 'rgb(50, 50, 50)', 0.5, 'left');
  });
}

export const drawStartingSoonGUI = () => {
  drawTextOutline(
    "Starting Soon (unless people leave)", 
    s.viewport.width / 2, 
    48, 
    "36px Arial", 
    'rgb(255, 255, 255)', 
    'rgb(50, 50, 50)', 
    1
  );
  drawProgressBar(
    s.viewport.width / 3, 
    72, 
    s.viewport.width / 3, 
    16, 
    'rgba(255, 255, 255, 0.5)', 
    '#7D5BA6', 
    sg.gameStateTimer, 
    0, 
    GLOBALS.startTimerLength
  );
}

export const drawGameOverGUI = () => {
  let c = s.ctx;
  c.fillStyle = "rgba(0, 0, 0, 0.5)";
  c.fillRect(0, 0, s.viewport.width, s.viewport.height);
  drawTextOutline(
    "Game Over", 
    s.viewport.width / 2, 
    48, 
    "42px Arial", 
    'rgb(255, 255, 255)', 
    'rgb(50, 50, 50)', 
    1
  );
  drawProgressBar(
    s.viewport.width / 3, 
    72, 
    s.viewport.width / 3, 
    16, 
    'rgba(255, 255, 255, 0.5)', 
    '#D81159', 
    sg.gameStateTimer, 
    GLOBALS.gameEndTimerLength,
    0
  );
  drawTextOutline(
    "Most Dangerous Noodle:", 
    s.viewport.width / 2, 
    s.viewport.height / 2 - 48, 
    "52px Arial", 
    'rgb(255, 255, 255)', 
    'rgb(50, 50, 50)', 
    2
  );
  drawTextOutline(
    `${sg.scoreboard[0][1]} with ${sg.scoreboard[0][2]} points!`, 
    s.viewport.width / 2, 
    s.viewport.height / 2 + 48, 
    "64px Arial", 
    'rgb(255, 255, 255)', 
    'rgb(50, 50, 50)', 
    2
  );
}

export const drawResetGUI = () => {
  drawTextOutline(
    "Reseting...", 
    s.viewport.width / 2, 
    48, 
    "36px Arial", 
    'rgb(255, 255, 255)', 
    'rgb(50, 50, 50)', 
    1
  );
}

export const drawPlayingGUI = () => {
  drawScoreboard(32, 64);
  drawTextOutline(
    "Time Left", 
    s.viewport.width / 2, 
    48, 
    "36px Arial", 
    'rgb(255, 255, 255)', 
    'rgb(50, 50, 50)', 
    1
  );
  drawProgressBar(
    s.viewport.width / 3, 
    72, 
    s.viewport.width / 3, 
    16, 
    'rgba(255, 255, 255, 0.5)', 
    '#55D6BE', 
    sg.gameStateTimer, 
    GLOBALS.roundTimerLength,
    0
  );
}

export const drawScoreboard = (x, y) => {
  const scoreboard = sg.scoreboard;
  let c = s.ctx;
  c.save();
  scoreboard.forEach((playerScore, i) => {
    if (i > 9) return;
    drawTextOutline("Sneakiest Sneks", x+136, y-16, "36px Arial", 'rgb(255, 255, 255)', 'rgb(50, 50, 50)', 1)
    drawTextOutline(playerScore[2], x, y+32+i*32, "24px Arial", 'rgb(255, 255, 255)', 'rgb(50, 50, 50)', 0.5, 'left');
    drawTextOutline(playerScore[1], x+96, y+32+i*32, "24px Arial", 'rgb(255, 255, 255)', 'rgb(50, 50, 50)', 0.5, 'left');
  });
  c.restore();
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
  let frontWidth = utils.map(val, minVal, maxVal, 0, width);
  c.fillRect(x, y, frontWidth, height);
  c.restore();
}

export const randomPalletteColor = () => {
  const allColors = [
    '#55D6BE',
    '#FFFD98',
    '#A833B9',
    '#AFD2E9',
    '#ED254E',
    '#F18805',
    '#7D5BA6',
    '#FC6471',
    '#D81159',
    '#606C38'
  ];
  return allColors[utils.randomInt(0, allColors.length-1)]
}

export const allPlayerSpriteNames = [
  ["snakeyMousePlayer", "Snakey Mouse"],
  ["jimmyTheSnakePlayer", "Jimmy"],
  ["dangerRatPlayer", "Danger Rat"],
  ["evilMousePlayer", "Evil Snakey Mouse"],
  ["cheetohPlayer", "Cheetoh"],
  ["moogliPlayer", "Moogli"],
  ["gearsPlayer", "Gears"],
  ["koboldPlayer", "Kobold"]
];
export const randomPlayerSprite = () => {
  return allPlayerSpriteNames[utils.randomInt(0, allPlayerSpriteNames.length-1)][0];
}
