import * as levels from './levels';

let playedLevelNames = [];
export const loadLevel = (_state, levelName) => {
  _state.level.activeLevelData = levels[levelName];
}
