import * as utils from './utils';

export const calculateDeltaTime = (_state) => {
  const st = _state.time;
  //Get time in ms
  const now = Date.now();
  //Get instant FPS (from last frame to this frame)
  st.fps = utils.clamp(1000 / ((now - st.lastTime) || 1), 5, 200);
  //Store this frame time
  st.lastTime = now;
  //Return the last frame's time (delta time) in seconds
  return 1 / st.fps;
}

export const update = (_state) => {
  const st = _state.time;
  //Get the delta time
  st.dt = calculateDeltaTime(_state);
}

export const startNewTimer = (_state, _id) => {
  _state.time.timers[_id] = Date.now();
}

export const getTimer = (_state, _id) => {
  if (_state.time.timers[_id] === undefined) return undefined;
  return (Date.now() - _state.time.timers[_id]) / 1000;
}

export const stopTimer = (_state, _id) => {
  if (_state.time.timers[_id] === undefined) return;
  delete _state.time.timers[_id];
}

export const runTime = (_state) => {
  return (Date.now() - _state.time.gameStartTime) / 1000;
}

export const dt = (_state) => {
  return _state.time.dt;
}

export const fps = (_state) => {
  return _state.time.fps;
}
