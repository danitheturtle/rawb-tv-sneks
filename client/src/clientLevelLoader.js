import engine from 'engine';
import assets from './assets';
const { levels } = engine;

export const loadLevel = (_state, _levelName) => {
  _state.level.activeLevelData = levels[_levelName];
  _state.level.activeBackgrounds = Object.entries(_state.level.activeLevelData.backgrounds)
    .sort(([_, bgData1], [__, bgData2]) => bgData1.zIndex < bgData2.zIndex ? -1 : 1)
    .map(([bgName, bgData]) => {
      const bgAsset = _state.image.backgrounds[bgName];
      bgAsset.parallaxSpeed = bgData.parallaxSpeed;
      return bgAsset;
    });
  _state.view.active?.rescaleGU(_state);
}