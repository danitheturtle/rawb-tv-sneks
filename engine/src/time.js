import * as utils from './utils';

export const calculateDeltaTime = (_state) => {
  const st = _state.time;
  //Get time in ms
  const now = Date.now();
  //Get instant FPS (from last frame to this frame)
  st.fps = utils.clamp(1000 / (now - st.lastTime), 5, 200);
  //Store this frame time
  st.lastTime = now;
  //Return the last frame's time (delta time) in seconds
  return 1 / st.fps;
}

export const update = (_state) => {
  const st = _state.time;
  //Get the delta time
  st.dt = calculateDeltaTime(_state);
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

export const startClientTimer = (_state, _id, _serverTime) => {
  st.clientTimers[_id] = _serverTime;
}

export const startNewTimer = (_state, _id) => {
  _state.time.timers[_id] = 0;
}

export const dt = (_state) => {
  return _state.time.dt;
}

export const runTime = (_state) => {
  return _state.time.runTime;
}

export const fps = (_state) => {
  return _state.time.fps;
}
