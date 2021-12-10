import engine from 'engine';
import Victor from 'victor';
const Vector = Victor;
const { Pickup, PICKUP_ODDS, GLOBALS, utils } = engine;

export const spawnPickup = (s, pickupType, x, y) => {
  let sg = s.game;

  let uid = sg.lastGameObjectUID++;
  let pickup = new Pickup(pickupType, x, y);
  sg.pickups[uid] = pickup;
  sg.pickupsTotal++;

  s.io.emit('updatePickup', {
    id: uid,
    pickupType: pickupType,
    x: x,
    y: y,
  });

  //remove extra pickups
  if (sg.pickupsTotal > GLOBALS.pickupCap) {
    let ids = Object.keys(sg.pickups);

    let toRemoveId = ids[utils.randomInt(0, ids.length - 1)];

    s.io.emit('collectedPickup', { pickupId: Number(toRemoveId) });

    sg.pickupsTotal--;
    delete sg.pickups[toRemoveId];
  }
}

export const resetPickups = (s) => {
  let sg = s.game;
  sg.pickups = {};
  s.io.emit('allPickups', []);

}

let totalOdds = 0;
for (let i = 0; i < PICKUP_ODDS.length; i++) {
  totalOdds += PICKUP_ODDS[i];
}
export const randomPickupType = () => {//TODO: this is broken somehow
  let selectedPickup = utils.randomInt(0, totalOdds - 1);
  // console.log("vrxa", selectedPickup);

  let i = 0;
  for (let j = 0; j < PICKUP_ODDS.length; j++) {
    selectedPickup -= PICKUP_ODDS[j];
    if(selectedPickup >= 0) {
      i++
    } else {
      // console.log("dbtb", i);
      return i;
    }
  }
  // console.log("fail");
  return 0;
}
