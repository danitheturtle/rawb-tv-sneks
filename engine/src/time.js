import * as utils from './utils';

let s, st;

export const init = (state) => {
  s = state;
  st = s.time;
}

export const calculateDeltaTime = () => {
  //Get time in ms
  const now = Date.now();
  //Get instant FPS (from last frame to this frame)
  st.fps = utils.clamp(1000 / (now - st.lastTime), 5, 200);
  //Store this frame time
  st.lastTime = now;
  //Return the last frame's time (delta time) in seconds
  return 1 / st.fps;
}

export const update = () => {
  //Get the delta time
  st.dt = calculateDeltaTime();
  //Add the delta to the total runtime
  st.runTime += st.dt;
  //Add the delta to all client timers
  for (const t in st.clientTimers) {
    st.clientTimers[t] += st.dt;
  }
  //Add the delta to all other timers
  for (const t in st.timers) {
    st.timers[t] += st.dt;
  }
}

export const startClientTimer = (_id, _serverTime) => {
  st.clientTimers[_id] = _serverTime;
}

export const startNewTimer = (_id) => {
  st.timers[_id] = 0;
}

export const dt = () => {
  return st.dt;
}

export const runTime = () => {
  return st.runTime;
}

export const fps = () => {
  return st.fps;
}
