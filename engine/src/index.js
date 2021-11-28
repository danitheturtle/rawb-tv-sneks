import * as physicsObjects from './physicsObjects';
import * as player from './player';
import * as state from './state';
import * as physics from './physics';
import * as time from './time';
import * as utils from './utils';
import * as levels from './levels';
import * as levelLoader from './levelLoader';
import scoring from './scoring';

export default {
  scoring,
  time,
  utils,
  physics,
  levelLoader,
  levels,
  ...state,
  ...physicsObjects,
  ...player
}
