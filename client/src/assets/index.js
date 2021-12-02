import coreTilesheetData from './tilesheets/coreTilesheet';
import coreTilesheet from './tilesheets/coreTilesheet.png';
import cheeseSpritesheet from './spritesheets/cheeseSpritesheet.png';
import cheeseSpritesheetData from './spritesheets/cheeseSpritesheet.js';
import p1SpritesheetData from './spritesheets/p1_spritesheet.js';
import p1Spritesheet from './spritesheets/p1_spritesheet.png';
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
    defaultBackground: [defaultBackground, {}],
    radicalBackground: [radicalBackground, {}],
    dangerBackground: [dangerBackground, {}],
    tutorialBackground: [tutorialBackground, {}]
  }
};

export default allAssets;