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
    const newPos = {
      x: utils.randomRange(0, s.level.activeLevelData.guWidth),
      y: utils.randomRange(0, s.level.activeLevelData.guHeight)
    }
    const newPickupId = `pickup-${newPos.x}-${newPos.y}`;
    if (sg.pickups[newPickupId]) { delete sg.pickups[newPickupId]; }
    //Get a random type for the pickup
    const pickupType = randomPickupType();
    sp.gameObjects[newPickupId] = sg.pickups[newPickupId] = new Pickup(s)
      .addCollider(new CircleCollider())
      .setData({
        id: newPickupId,
        x: newPos.x,
        y: newPos.y,
        pickupType: pickupType[0],
        worth: pickupType[1],
        collider: {
          radius: 1
        }
      });
    s.io.emit('updatePickup', sg.pickups[newPickupId].getData());
  }
  
  //remove extra pickups
  while (Object.keys(sg.pickups).length > GLOBALS.pickupCap) {
    const allPickupKeys = Object.keys(sg.pickups);
    const toRemove = sg.pickups[allPickupKeys[utils.randomInt(0, allPickupKeys.length-1)]];
    s.io.emit('collectedPickup', { pickupId: toRemove.id });
    delete sp.gameObjects[toRemove.id];
    delete sg.pickups[toRemove.id];
  }
  
  loopCount++;
  loopCount = loopCount % 3600;
}

export const reset = () => {
  s.io.emit('allPickups', []);
  Object.keys(sg.pickups).forEach(pickupId => {
    delete sp.gameObjects[pickupId];
    delete sg.pickups[pickupId];
  });
  sg.scoreboard = [];
}

export const updatePlayerScore = (clientId) => {
  if (!sg.players[clientId]) return;
  //Find the player in the existing scoreboard
  let foundIndex;
  for (let i=0; i<sg.scoreboard.length; i++) {
    if (clientId == sg.scoreboard[i]?.[0]) {
      foundIndex = i;
      break;
    }
  }
  //If player is already in the array of scores, update score
  if (foundIndex !== undefined) {
    sg.scoreboard[foundIndex][2] = sg.players[clientId].score;
  //Else, add new score array for this player
  } else {
    sg.scoreboard.push([clientId, sg.players[clientId].name, sg.players[clientId].score])
  }
}

export const randomPickupType = () => {
  const allPickupTypes = [
    ["regularCheese", 1, 500],
    ["goldenCheese", 2, 50],
    ["pizzaCheese", 3, 50],
    ["epicCheese", 4, 10],
    ["fireyCheese", 5, 5],
    ["squirrelCheese", 5, 5],
    ["icyCheese", 5, 5],
    ["hairyCheese", 5, 5],
    ["diceyCheese", 5, 5],
    ["radicalCheese", 10, 1],
    ["wisdomCheese", 10, 1]
  ];
  const totalOdds = allPickupTypes.reduce((acc, pickup) => acc + pickup[2], 0);
  const selectedPickup = utils.randomInt(0, totalOdds);
  let count = 0;
  return allPickupTypes.reduce((acc, pickup) => {
    if (acc) return acc;
    count += pickup[2];
    if (selectedPickup < count) {
      return pickup;
    }
  }, undefined) || ["regularCheese", 1];
}