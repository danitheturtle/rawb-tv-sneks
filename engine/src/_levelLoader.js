import * as levels from './levels';

let state, sg, sl;
let playedLevelNames = [];
export const init = (_state) => {
  state = _state;
  sg = state.game;
  sl = state.level;
}

export const loadLevel = (levelName) => {
  sl.activeLevelData = levels[levelName];
}
