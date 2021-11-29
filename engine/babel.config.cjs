const baseConfig = require('../babel.config.cjs');

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
