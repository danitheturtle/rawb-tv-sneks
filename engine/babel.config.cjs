const baseConfig = require('../babel.config.js');

module.exports = function config(api) {
  const baseConfigResult = baseConfig(api);
  return {
    ...baseConfigResult,
    plugins: [...baseConfigResult.plugins],
    overrides: [
      ...baseConfigResult.overrides
    ]
  };
}
