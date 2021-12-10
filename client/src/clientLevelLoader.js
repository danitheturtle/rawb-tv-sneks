import engine from 'engine';
const { levels } = engine;


export const loadLevel = (s, levelName) => {
  let si = s.image
  let sg = s.game
  let sv = s.view
  sg.activeLevelData = levels[levelName];
  s.activeBackgrounds = Object.entries(sg.activeLevelData.backgrounds)
    .sort(([_, bgData1], [__, bgData2]) => bgData1.zIndex < bgData2.zIndex ? -1 : 1)
    .map(([bgName, bgData]) => {
      const bgAsset = si.backgrounds[bgName];
      bgAsset.parallaxSpeed = bgData.parallaxSpeed;
      return bgAsset;
    });
  sv.active?.rescaleGU(s);
}
