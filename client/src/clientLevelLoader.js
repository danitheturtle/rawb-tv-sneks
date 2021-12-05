import engine from 'engine';
import assets from './assets';
const { levelLoader, levels } = engine;

let s, sp, si, sg, sv, sl;

export const init = (_state) => {
  s = _state;
  sp = s.physics;
  sg = s.game;
  si = s.image;
  sv = s.view;
  sl = s.level;
  
  levelLoader.init(_state);
}

export const start = () => {
  levelLoader.start();
}

export const loadLevel = (levelName) => {
  levelLoader.loadLevel(levelName);
  sl.activeBackgrounds = Object.entries(sl.activeLevelData.backgrounds)
    .sort(([_, bgData1], [__, bgData2]) => bgData1.zIndex < bgData2.zIndex ? -1 : 1)
    .map(([bgName, bgData]) => {
      const bgAsset = si.backgrounds[bgName];
      bgAsset.parallaxSpeed = bgData.parallaxSpeed;
      return bgAsset;
    });
  sv.active?.rescaleGU();
}