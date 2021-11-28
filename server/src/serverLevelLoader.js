import engine from 'engine';
const { levelLoader, levels, utils } = engine;
const { randomInt } = utils;
let s, sp, si, sg, io;
let playedLevelNames = [];
export const init = (_state) => {
  s = _state;
  sp = s.physics;
  sg = s.game;
  si = s.image;
  io = s.io;
  
  levelLoader.init(_state);
}

export const start = () => {
  levelLoader.start();
  loadRandomLevel();
}

export const restart = () => {
  loadRandomLevel();
}

export const loadRandomLevel = () => {
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
  levelLoader.loadLevel(nextLevelName);
  playedLevelNames.push(nextLevelName);
  io.emit('loadLevel', nextLevelName)
}