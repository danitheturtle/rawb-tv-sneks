/**
 * Get a cross-browser viewport object with related size data
 */
export const getViewport = () => {
  var ele = window,
    pre = 'inner';
  if (!('innerWidth' in window)) {
    pre = 'client';
    ele = document.documentElement || document.body;
  }
  //Width of window
  return {
    width: ele[pre + 'Width'],
    //Height of window
    height: ele[pre + 'Height'],
    //View width css unit
    vw: ele[pre + 'Width'] / 100.0,
    //View Height css unit
    vh: ele[pre + 'Height'] / 100.0
  };
}