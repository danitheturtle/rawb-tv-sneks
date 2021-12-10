import { Spritesheet } from './spritesheet';
import { Background } from './background';
import engine from 'engine';
import { CLIENT_STATES } from '../clientState';
import * as playerRenderer from './playerRenderer';
import * as spriteRenderer from './spriteRenderer';
const { utils, GLOBALS } = engine;
let layers = [];

export const init = (s) => {
  let sg = s.game;
  let si = s.image;
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
}

export const draw = (s) => {
  let sg = s.game;
  let sv = s.view;
  //draw background
  const backs = s.activeBackgrounds;
  backs.forEach(back => {
    const dx = sv.active.xMin() * back.parallaxSpeed[0];
    const dy = sv.active.yMin() * back.parallaxSpeed[1];
    const dHeight = sg.activeLevelData.guWidth * sg.gu;
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
      let sheet = getSheet(s, tileID);
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

      let destPos = sv.active.getObjectRelativePosition(s, {
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
  for (const go in sg.pickups) {//TODO: here
    spriteRenderer.drawPickup(s, sg.pickups[go]);
  }
  for (const go in sg.players) {
    playerRenderer.draw(s, sg.players[go]);
  }
}

export const drawGUI = (s) => {
  let sg = s.game;
  if (sg.clientState === CLIENT_STATES.PLAYING || sg.clientState === CLIENT_STATES.PAUSED);
  switch (sg.gameState) {//TODO: there is a minor sync bug here relating to the gameState being updated without being sent the relevant data
    case CLIENT_STATES.GAME_WAITING_FOR_PLAYERS:
      {//drawWaitingForPlayersGUI
        drawTextOutline(s,
          "Waitinig for Players (min 3)",
    "Waitinig for Players (min 3)",
          "Waitinig for Players (min 3)",
    "Waitinig for Players (min 3)",
          "Waitinig for Players (min 3)",
    "Waitinig for Players (min 3)",
          "Waitinig for Players (min 3)",
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
          48,
    48,
          48,
    48,
          48,
    48,
          48,
          "36px Arial",
    "36px Arial",
          "36px Arial",
    "36px Arial",
          "36px Arial",
    "36px Arial",
          "36px Arial",
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
          1
        );
        Object.values(sg.players).forEach((player, i) => {
          if (i > 20) return;
          drawTextOutline(s, "Sneks in a Lobby", 186, 48, "36px Arial", 'rgb(255, 255, 255)', 'rgb(50, 50, 50)', 1)
          drawTextOutline(s, player.playerName, 48, 96+i*32, "24px Arial", 'rgb(255, 255, 255)', 'rgb(50, 50, 50)', 0.5, 'left');
        });
      }
      break;

    case CLIENT_STATES.GAME_STARTING_SOON:
      {//drawStartingSoonGUI
        drawTextOutline(s,
          "Starting Soon (unless people leave)",
    "Starting Soon (unless people leave)",
          "Starting Soon (unless people leave)",
    "Starting Soon (unless people leave)",
          "Starting Soon (unless people leave)",
    "Starting Soon (unless people leave)",
          "Starting Soon (unless people leave)",
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
          48,
    48,
          48,
    48,
          48,
    48,
          48,
          "36px Arial",
    "36px Arial",
          "36px Arial",
    "36px Arial",
          "36px Arial",
    "36px Arial",
          "36px Arial",
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
          1
        );
        drawProgressBar(
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
          72,
    72,
          72,
    72,
          72,
    72,
          72,
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
          16,
    16,
          16,
    16,
          16,
    16,
          16,
          'rgba(255, 255, 255, 0.5)',
    'rgba(255, 255, 255, 0.5)',
          'rgba(255, 255, 255, 0.5)',
    'rgba(255, 255, 255, 0.5)',
          'rgba(255, 255, 255, 0.5)',
    'rgba(255, 255, 255, 0.5)',
          'rgba(255, 255, 255, 0.5)',
          '#7D5BA6',
    '#7D5BA6',
          '#7D5BA6',
    '#7D5BA6',
          '#7D5BA6',
    '#7D5BA6',
          '#7D5BA6',
          s.serverTime - sg.gameStartTimer,
          0,
    0,
          0,
    0,
          0,
    0,
          0,
          GLOBALS.startTimerLength
        );
      }
      break;

    case CLIENT_STATES.GAME_OVER:
      {//drawGameOverGUI
        let c = s.ctx;
        c.fillStyle = "rgba(0, 0, 0, 0.5)";
        c.fillRect(0, 0, s.viewport.width, s.viewport.height);
        drawTextOutline(s,
          "Game Over",
    "Game Over",
          "Game Over",
    "Game Over",
          "Game Over",
    "Game Over",
          "Game Over",
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
          48,
    48,
          48,
    48,
          48,
    48,
          48,
          "42px Arial",
    "42px Arial",
          "42px Arial",
    "42px Arial",
          "42px Arial",
    "42px Arial",
          "42px Arial",
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
          1
        );
        drawProgressBar(
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
          72,
    72,
          72,
    72,
          72,
    72,
          72,
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
          16,
    16,
          16,
    16,
          16,
    16,
          16,
          'rgba(255, 255, 255, 0.5)',
    'rgba(255, 255, 255, 0.5)',
          'rgba(255, 255, 255, 0.5)',
    'rgba(255, 255, 255, 0.5)',
          'rgba(255, 255, 255, 0.5)',
    'rgba(255, 255, 255, 0.5)',
          'rgba(255, 255, 255, 0.5)',
          '#D81159',
    '#D81159',
          '#D81159',
    '#D81159',
          '#D81159',
    '#D81159',
          '#D81159',
          s.serverTime - sg.gameEndTimer,
          GLOBALS.gameEndTimerLength,
          0
        );
        drawTextOutline(s,
          "Most Dangerous Noodle:",
    "Most Dangerous Noodle:",
          "Most Dangerous Noodle:",
    "Most Dangerous Noodle:",
          "Most Dangerous Noodle:",
    "Most Dangerous Noodle:",
          "Most Dangerous Noodle:",
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
          s.viewport.height / 2 - 48,
    s.viewport.height / 2 - 48,
          s.viewport.height / 2 - 48,
    s.viewport.height / 2 - 48,
          s.viewport.height / 2 - 48,
    s.viewport.height / 2 - 48,
          s.viewport.height / 2 - 48,
          "52px Arial",
    "52px Arial",
          "52px Arial",
    "52px Arial",
          "52px Arial",
    "52px Arial",
          "52px Arial",
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
          2
        );
        drawTextOutline(s,
          `${sg.scoreboard[0][1]} with ${sg.scoreboard[0][2]} points!`,
    `${sg.scoreboard[0][1]} with ${sg.scoreboard[0][2]} points!`,
          `${sg.scoreboard[0][1]} with ${sg.scoreboard[0][2]} points!`,
    `${sg.scoreboard[0][1]} with ${sg.scoreboard[0][2]} points!`,
          `${sg.scoreboard[0][1]} with ${sg.scoreboard[0][2]} points!`,
    `${sg.scoreboard[0][1]} with ${sg.scoreboard[0][2]} points!`,
          `${sg.scoreboard[0][1]} with ${sg.scoreboard[0][2]} points!`,
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
          s.viewport.height / 2 + 48,
    s.viewport.height / 2 + 48,
          s.viewport.height / 2 + 48,
    s.viewport.height / 2 + 48,
          s.viewport.height / 2 + 48,
    s.viewport.height / 2 + 48,
          s.viewport.height / 2 + 48,
          "64px Arial",
    "64px Arial",
          "64px Arial",
    "64px Arial",
          "64px Arial",
    "64px Arial",
          "64px Arial",
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
          2
        );
      }
      break;

    case CLIENT_STATES.GAME_RESETTING:
      {//drawResetGUI
        drawTextOutline(s,
          "Reseting...",
    "Reseting...",
          "Reseting...",
    "Reseting...",
          "Reseting...",
    "Reseting...",
          "Reseting...",
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
          48,
    48,
          48,
    48,
          48,
    48,
          48,
          "36px Arial",
    "36px Arial",
          "36px Arial",
    "36px Arial",
          "36px Arial",
    "36px Arial",
          "36px Arial",
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
          1
        );
      }
      break;
    case CLIENT_STATES.GAME_PLAYING:
    default:
      {
        drawScoreboard(s, 32, 64);
        drawTextOutline(s,
          "Time Left",
    "Time Left",
          "Time Left",
    "Time Left",
          "Time Left",
    "Time Left",
          "Time Left",
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
    s.viewport.width / 2,
          s.viewport.width / 2,
          48,
    48,
          48,
    48,
          48,
    48,
          48,
          "36px Arial",
    "36px Arial",
          "36px Arial",
    "36px Arial",
          "36px Arial",
    "36px Arial",
          "36px Arial",
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
    'rgb(255, 255, 255)',
          'rgb(255, 255, 255)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
    'rgb(50, 50, 50)',
          'rgb(50, 50, 50)',
          1
        );
        drawProgressBar(
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
          72,
    72,
          72,
    72,
          72,
    72,
          72,
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
    s.viewport.width / 3,
          s.viewport.width / 3,
          16,
    16,
          16,
    16,
          16,
    16,
          16,
          'rgba(255, 255, 255, 0.5)',
    'rgba(255, 255, 255, 0.5)',
          'rgba(255, 255, 255, 0.5)',
    'rgba(255, 255, 255, 0.5)',
          'rgba(255, 255, 255, 0.5)',
    'rgba(255, 255, 255, 0.5)',
          'rgba(255, 255, 255, 0.5)',
          '#55D6BE',
    '#55D6BE',
          '#55D6BE',
    '#55D6BE',
          '#55D6BE',
    '#55D6BE',
          '#55D6BE',
          s.serverTime - sg.roundTimer,
          GLOBALS.roundTimerLength,
          0
        );
      }
      break;
  }
}

export const drawScoreboard = (s, x, y) => {
  let sg = s.game;
  const scoreboard = sg.scoreboard;
  let c = s.ctx;
  c.save();
  scoreboard.forEach((playerScore, i) => {
    if (i > 9) return;
    drawTextOutline(s, "Sneakiest Sneks", x+136, y-16, "36px Arial", 'rgb(255, 255, 255)', 'rgb(50, 50, 50)', 1)
    drawTextOutline(s, playerScore[2], x, y+32+i*32, "24px Arial", 'rgb(255, 255, 255)', 'rgb(50, 50, 50)', 0.5, 'left');
    drawTextOutline(s, playerScore[1], x+96, y+32+i*32, "24px Arial", 'rgb(255, 255, 255)', 'rgb(50, 50, 50)', 0.5, 'left');
  });
  c.restore();
}

export const createTileLayer = (layerData) => {
  layers.push(layerData);
}

export const getSheet = (s, tileID) => {
  let si = s.image;
  for (const sid in si.tilesheets) {
    if (tileID - si.tilesheets[sid].tileStart < si.tilesheets[sid].tileCount) {
      return si.tilesheets[sid];
    }
  }
  return undefined;
}

export const drawText = (s, string, x, y, css, color, textAlign = "center", textBaseline = "middle") => {
  let c = s.ctx;
  c.save();
  c.font = css;
  c.fillStyle = color;
  c.textAlign = textAlign;
  c.textBaseline = textBaseline;
  c.fillText(string, x, y);
  c.restore();
}

// export const drawShadowText = (
//   s,
//   string,
//   x,
//   y,
//   css,
//   shadowColor,
//   textColor,
//   offsetX = 5,
//   offsetY = 5,
//   textAlign = "center",
//   textBaseline = "middle"
// ) => {
//   //Draw shadow
//   drawText(s, string, x + offsetX, y + offsetY, css, shadowColor, textAlign, textBaseline);
//   //Draw text
//   drawText(s, string, x, y, css, textColor, textAlign, textBaseline);
// }

export const drawTextOutline = (
  s,
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

export const drawProgressBar = (s, x, y, width, height, backColor, frontColor, val, minVal, maxVal) => {
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
  ["beepatronPlayer", "Beepatron"],
  ["cheetohPlayer", "Cheetoh"],
  ["dangerRatPlayer", "Danger Rat"],
  ["goatPlayer", "Goat"],
  ["illidanPlayer", "Illidan"],
  ["jimmyPlayer", "Jimmy"],
  ["koboldPlayer", "Kobold"],
  ["monicaPlayer", "Monica"],
  ["moogliPlayer", "Moogli"],
  ["owlPlayer", "Owl"],
  ["sleepylilturtlePlayer", "Sleepy Turtle"],
  ["snakeyMousePlayer", "Snakey Mouse"],
  ["vampireMonicaPlayer", "Vampire Monica"],
  ["vampireMousePlayer", "Vampire Mouse"]
];
export const randomPlayerSprite = () => {
  return allPlayerSpriteNames[utils.randomInt(0, allPlayerSpriteNames.length-1)][0];
}
