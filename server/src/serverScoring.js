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
  
  if (loopCount % (3600 / GLOBALS.numPickupsPerMinute) === 0 && Object.keys(sg.pickups).length < GLOBALS.pickupCap) {
    const newPickup = new Pickup(
      s, 
      sp.lastGameObjectID++,
      new Vector(
        utils.randomRange(0, s.level.activeLevelData.guWidth), 
        utils.randomRange(0, s.level.activeLevelData.guHeight)
      ), 
      1,
      new CircleCollider(1)
    );
    sg.pickups[newPickup.id] = newPickup;
  }
  
  //remove extra pickups
  while (Object.keys(sg.pickups).length > GLOBALS.pickupCap) {
    const toRemove = sg.pickups[utils.randomInt(0, Object.keys(sg.pickups).length-1)];
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