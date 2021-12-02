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
  sl.activeBackground = si.backgrounds[sl.activeLevelData.background];
  sv.active?.rescaleGU();
}