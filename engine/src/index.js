import * as player from './player';
import * as pickup from './pickup';
import * as state from './state';
import * as physics from './physics';
import * as time from './time';
import * as utils from './utils';
import * as levels from './levels';

export default {
  time,
  utils,
  levels,
  physics,
  ...state,
  ...player,
  ...pickup
}
