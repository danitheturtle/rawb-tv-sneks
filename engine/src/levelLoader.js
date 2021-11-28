import * as levels from './levels';

let state, sg;
let playedLevelNames = [];
export const init = (_state) => {
  state = _state;
  sg = state.game;
}

export const start = () => {
  
}

export const loadLevel = (levelName) => {
  sg.activeLevel = levels[levelName];
}
