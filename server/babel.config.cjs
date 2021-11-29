const baseConfig = require('../babel.config.cjs');

module.exports = function config(api) {
  const baseConfigResult = baseConfig(api);
  return {
    ...baseConfigResult,
    overrides: [
      ...baseConfigResult.overrides
    ]
  };
}
