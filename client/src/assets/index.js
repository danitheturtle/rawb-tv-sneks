import coreTilesheetData from './tilesheets/coreTilesheet';
import coreTilesheet from './tilesheets/coreTilesheet.png';
import cheeseSpritesheet from './spritesheets/cheeseSpritesheet.png';
import cheeseSpritesheetData from './spritesheets/cheeseSpritesheet.js';
import p1SpritesheetData from './spritesheets/p1_spritesheet.js';
import p1Spritesheet from './spritesheets/p1_spritesheet.png';
import snakeyMousePlayerSpritesheet from './spritesheets/snakeyMousePlayerSpritesheet.png';
import snakeyMousePlayerSpritesheetData from './spritesheets/snakeyMousePlayerSpritesheet.js';
import jimmyTheSnakePlayerSpritesheet from './spritesheets/jimmyTheSnakePlayerSpritesheet.png';
import jimmyTheSnakePlayerSpritesheetData from './spritesheets/jimmyTheSnakePlayerSpritesheet.js';
import dangerRatPlayerSpritesheet from './spritesheets/dangerRatPlayerSpritesheet.png';
import dangerRatPlayerSpritesheetData from './spritesheets/dangerRatPlayerSpritesheet.js';
import evilMousePlayerSpritesheet from './spritesheets/evilMousePlayerSpritesheet.png';
import evilMousePlayerSpritesheetData from './spritesheets/evilMousePlayerSpritesheet.js';
import defaultBackground from './backgrounds/bg_grasslands.png';
import dangerBackground from './backgrounds/bg_danger.png';
import radicalBackground from './backgrounds/bg_radical.png';
import tutorialBackground from './backgrounds/tutorial.png';
// console.dir(coreTilesheetData);
const allAssets = {
  images: {
    coreTilesheet: [coreTilesheet, coreTilesheetData],
    p1Spritesheet: [p1Spritesheet, p1SpritesheetData],
    cheeseSpritesheet: [cheeseSpritesheet, cheeseSpritesheetData],
    snakeyMousePlayerSpritesheet: [snakeyMousePlayerSpritesheet, snakeyMousePlayerSpritesheetData],
    jimmyTheSnakePlayerSpritesheet: [jimmyTheSnakePlayerSpritesheet, jimmyTheSnakePlayerSpritesheetData],
    dangerRatPlayerSpritesheet: [dangerRatPlayerSpritesheet, dangerRatPlayerSpritesheetData],
    evilMousePlayerSpritesheet: [evilMousePlayerSpritesheet, evilMousePlayerSpritesheetData],
    defaultBackground: [defaultBackground, {}],
    radicalBackground: [radicalBackground, {}],
    dangerBackground: [dangerBackground, {}],
    tutorialBackground: [tutorialBackground, {}]
  }
};

export default allAssets;