import baseConfig from '../babel.config.js';

export default config(api) {
  const baseConfigResult = baseConfig(api);
  return {
    ...baseConfigResult,
    plugins: [
      ...baseConfigResult.plugins
    ],
    overrides: [
      ...baseConfigResult.overrides,
      {
        test: /\.js$/,
        presets: [
          [
            "@babel/preset-react",
            {
              development: api.env() === "development",
              useBuiltIns: true,
              runtime: "automatic"
            }
          ]
        ]
      }
    ]
  };
}
