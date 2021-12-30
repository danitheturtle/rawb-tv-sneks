import engine from 'engine';
const { levels, utils } = engine;
const { randomInt } = utils;
let playedLevelNames = [];

export const loadRandomLevel = (_state) => {
  //select level from ones available
  let possibleNextLevels = Object.entries(levels)
    .filter(([levelName]) => (!playedLevelNames.includes(levelName)));
  //reset if all levels have been played
  if (possibleNextLevels.length === 0) {
    possibleNextLevels = Object.entries(levels);
    playedLevelNames = [];
  }
  const selectedIndex = randomInt(0, possibleNextLevels.length - 1);
  const nextLevelName = possibleNextLevels[selectedIndex][0];
  _state.level.activeLevelData = levels[nextLevelName];
  playedLevelNames.push(nextLevelName);
  _state.io.emit('loadLevel', nextLevelName)
}