import engine from 'engine';
const { levelLoader, levels } = engine;

let s, sp, si, sg, sv;

export const init = (_state) => {
  s = _state;
  sp = s.physics;
  sg = s.game;
  si = s.image;
  sv = s.view;
  
  levelLoader.init(_state);
}

export const start = () => {
  levelLoader.start();
}

export const loadLevel = (levelName) => {
  levelLoader.loadLevel(levelName);
  sv.active?.rescaleGU();
}