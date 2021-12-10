import * as player from './player';
import * as state from './state';
import * as utils from './utils';
import * as levels from './levels';

export default {
  utils,
  levels,
  ...state,
  ...player,
}
