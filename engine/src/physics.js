import Victor from 'victor';
import utils from './utils';
import time from './time';
import { GameObject, Manifold } from './physicsObjects';
const Vector = Victor;
let state, sp;

export const init = (_state) => {
  state = _state;
  sp = state.physics;
}

export const start = () => {
  //additional setup once all modules have been initialized
}

export const update = () => {
  //Update gameObjects
  for (const goID in sp.gameObjects) {
    const obj = sp.gameObjects[goID];
    //Update the object
    obj.update();
  }
}

export const CircleCircle = (col1, col2) => {
  let m = new Manifold();

  //Get centers
  let center1 = col1.center();
  let center2 = col2.center();
  //Get radii
  let radius1 = col1.radius();
  let radius2 = col2.radius();
  
  const dist = center2.clone().subtract(center1);
  if (dist.length() <= radius1 + radius2) {
    m.penetration = Math.abs(radius1 - radius2);
    m.norm = dist.clone().normalize();
  }
  return m;
}

export const AABB = (col1, col2) => {
  //Create an empty collision manifold
  let m = new Manifold();

  //Get centers
  let center1 = col1.center();
  let center2 = col2.center();

  //Center to corner
  let ctc1 = col1.centerToCorner();
  ctc1.y += 0.01;
  let ctc2 = col2.centerToCorner();

  //Vector from the center of 1 to the center of 2
  let t = center2.clone().subtract(center1);

  /*
    If the rectangles overlap on an axis, the rects are colliding on it
  */
  //Check x axis
  if (Math.abs(t.x) < ctc1.x + ctc2.x) {
    //Calculate overlap on the x axis
    let xOverlap = ctc1.x + ctc2.x - Math.abs(t.x);
    //Check y axis
    if (Math.abs(t.y) < ctc1.y + ctc2.y) {
      //Calculate overlap on the y axis
      let yOverlap = ctc1.y + ctc2.y - Math.abs(t.y);

      //At this point we know collision is happening.  Find the collision normal
      //If x is smaller
      if (xOverlap < yOverlap) {
        m.penetration = xOverlap;
        //Get the direction normal
        m.norm = new Vector(t.x < 0 ? -1.0 : 1.0, 0.0);
      } else {
        m.penetration = yOverlap;
        m.norm = new Vector(0.0, t.y < 0 ? -1.0 : 1.0);
      }
    }
  }
  return m;
}

export const collide = (col1, col2) => {
  if (col1.type === 'circle' && col2.type === 'circle') {
    return CircleCircle(col1, col2);
  } else if (col1.type === 'boundingBox' && col2.type === 'boundingBox') {
    return AABB(col1, col2);
  }
}
