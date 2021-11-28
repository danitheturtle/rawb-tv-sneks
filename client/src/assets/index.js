import coreTilesheetData from './tilesheets/coreTilesheet';
import coreTilesheet from './tilesheets/coreTilesheet.png';
import p1SpritesheetData from './spritesheets/p1_spritesheet.js';
import p1Spritesheet from './spritesheets/p1_spritesheet.png';
import defaultBackground from './backgrounds/bg_grasslands.png';
import tutorialBackground from './backgrounds/tutorial.png';
// console.dir(coreTilesheetData);
const allAssets = {
  images: {
    coreTilesheet: [coreTilesheet, coreTilesheetData],
    p1Spritesheet: [p1Spritesheet, p1SpritesheetData],
    defaultBackground: [defaultBackground, {}],
    tutorialBackground: [tutorialBackground, {}]
  }
};

export default allAssets;