import engine from 'engine';
const { levels, utils } = engine;
const { randomInt } = utils;


export const init = (s) => {
  loadRandomLevel(s);
}

export const restart = (s) => {
  loadRandomLevel(s);
}

export const loadRandomLevel = (s) => {
  let sg = s.game;
  //select level from ones available
  let possibleNextLevels = Object.entries(levels)
    .filter(([levelName]) => (!sg.playedLevelNames.includes(levelName)));
  //reset if all levels have been played
  if (possibleNextLevels.length === 0) {
    possibleNextLevels = Object.entries(levels);
    sg.playedLevelNames = [];
  }
  const selectedIndex = randomInt(0, possibleNextLevels.length - 1);
  const nextLevelName = possibleNextLevels[selectedIndex][0];
  sg.activeLevelData = levels[nextLevelName];
  sg.playedLevelNames.push(nextLevelName);
  s.io.emit('loadLevel', nextLevelName)
}
