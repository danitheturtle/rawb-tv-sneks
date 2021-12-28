import * as player from './player';
import * as pickup from './pickup';
import * as state from './state';
import * as physics from './physics';
import * as time from './time';
import * as utils from './utils';
import * as levels from './levels';
import * as levelLoader from './levelLoader';

export default {
  time,
  utils,
  levelLoader,
  levels,
  physics,
  ...state,
  ...player,
  ...pickup
}
