import engine from 'engine';
import Victor from 'victor';
const Vector = Victor;
const { Pickup, GLOBALS, CircleCollider, utils } = engine;

let s, sg, sl, sp;
export const init = (_state) => {
  s = _state;
  sg = s.game;
  sl = s.level;
  sp = s.physics;
}

let loopCount = 0;
export const update = () => {
  if (!sl.activeLevelData) return;
  
  if (loopCount % (3600 / GLOBALS.numPickupsPerMinute) === 0) {
    const newPickupId = sp.lastGameObjectID++;
    sp.gameObjects[newPickupId] = sg.pickups[newPickupId]= new Pickup(s)
      .addCollider(new CircleCollider())
      .setData({
        id: newPickupId,
        x: utils.randomRange(0, s.level.activeLevelData.guWidth),
        y: utils.randomRange(0, s.level.activeLevelData.guHeight),
        collider: {
          radius: 1
        }
      });
  }
  
  //remove extra pickups
  while (Object.keys(sg.pickups).length > GLOBALS.pickupCap) {
    const allPickupKeys = Object.keys(sg.pickups);
    const toRemove = sg.pickups[allPickupKeys[utils.randomInt(0, allPickupKeys.length-1)]];
    delete sp.gameObjects[toRemove.id];
    delete sg.pickups[toRemove.id];
  }
  
  loopCount++;
  loopCount = loopCount % 3600;
}

export const reset = () => {
  Object.keys(sg.pickups).forEach(pickupId => {
    delete sp.gameObjects[pickupId];
    delete sg.pickups[pickupId];
  });
}