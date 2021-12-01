const baseConfig = require('../babel.config.cjs');

module.exports = function config(api) {
  const baseConfigResult = baseConfig(api);
  return {
    ...baseConfigResult,
    plugins: [
      ...baseConfigResult.plugins,
      [
        "import-path-replace",
        {
          "rules": [{
            "match": "engine",
            "replacement": api.env() === "production" ? "../engine/index.js" : "engine"
          }, {
            "match": "environmentVars",
            "replacement": api.env() === "production" ? "../env" : "env"
          }]
        }
      ]
    ],
    overrides: [
      ...baseConfigResult.overrides
    ]
  };
}
