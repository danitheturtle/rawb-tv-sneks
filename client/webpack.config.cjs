const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const pkg = require("./package.json");

/**
 * @param {Record<string, boolean> | undefined} envName
 * @param {{ env: "production" | "development" }} options
 * @returns {import("webpack").Configuration}
 */
module.exports = function config(envArg) {
  const isEnvProduction = envArg.production;
  const isEnvDevelopment = envArg.development;
  const isDevServer = isEnvDevelopment && process.argv.includes("serve");
  //include env from different place based on environment
  if (isEnvProduction) {
    require('../dist/env/index.cjs');
  } else if (isEnvDevelopment) {
    require('env');
  }
  //profiling prod environment to debug issues?
  const isEnvProductionProfile = isEnvProduction && process.argv.includes("--profile");

  process.env.BABEL_ENV = isEnvDevelopment ? 'development' : 'production';
  process.env.BROWSERSLIST_ENV = isEnvDevelopment ? 'development' : 'production';

  /**
   * Client-side application bundle.
   *
   * @see https://webpack.js.org/configuration/
   * @type {Configuration}
   */
  const appConfig = {
    name: "app",
    mode: isEnvProduction ? "production" : "development",
    target: "web",
    bail: isEnvProduction,

    entry: "./src",

    output: {
      path: path.resolve(__dirname, "../dist/client"),
      publicPath: "/",
      assetModuleFilename: 'image/[hash][ext][query]',
      environment: {
        arrowFunction: true,
        destructuring: true,
        dynamicImport: false,
        module: true
      }
    },
    devtool: isEnvProduction ? "source-map" : "cheap-module-source-map",

    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            keep_classnames: isEnvProductionProfile,
            keep_fnames: isEnvProductionProfile,
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
        }),
      ],
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          commons: {
            test: /[\\/].yarn[\\/]/,
            name: "vendors",
            chunks: "all",
          },
        },
      },
      runtimeChunk: {
        name: (entrypoint) => `runtime-${entrypoint.name}`,
      },
    },

    performance: {
      maxAssetSize: 600 * 1024,
      maxEntrypointSize: 600 * 1024,
    },

    module: {
      rules: [
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
          generator: {
            filename: 'style/[hash][ext][query]'
          }
        },
        {
          test: /\.json$/i,
          use: 'json-loader'
        },
        {
          test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
          type: 'asset/resource'
        },
        {
          test: /\.(js|jsx)$/,
          include: path.resolve(__dirname),
          loader: "babel-loader",
          options: {
            rootMode: "upward",
            sourceType: "module",
            plugins: [[
              "import-path-replace",
              {
                "rules": [{
                  "match": "engine",
                  "replacement": isEnvProduction ? path.resolve(__dirname, '../dist/engine') : 'engine'
                }]
              }
            ]],
            cacheDirectory: `../.cache/${pkg.name}.benvironmentVarsabel-loader`,
            cacheCompression: false,
            compact: isEnvProduction,
          },
        },
      ],
    },

    plugins: [
      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin({
        inject: true,
        template: path.resolve(__dirname, "src/public/index.html"),
        ...(isEnvProduction && {
          minify: {
            removeComments: true,
            collapseWhitespace: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyAttributes: true,
            removeStyleLinkTypeAttributes: true,
            keepClosingSlash: true,
            minifyJS: true,
            minifyCSS: true,
            minifyURLs: true,
          },
        }),
      }),
      //Load ENV
      new webpack.DefinePlugin(
        Object.entries(process.env).map(
          ([k, v]) => ([`env.${k}`, `"${v}"` ])
        ).filter(
          ([k]) => !k.includes('SECRET') && !k.includes('PASSWORD')
        ).reduce(
          (acc, [envVarKey, envVarVal]) => { acc[envVarKey] = envVarVal; return acc; },
          {}
        )
      ),
      !isDevServer && false &&
        new CopyWebpackPlugin({
          patterns: [
            {
              from: "./src/public",
              filter: (filename) => filename !== path.resolve(__dirname, "src/public/index.html"),
              noErrorOnMissing: true,
            },
          ],
        }),
      isDevServer && new webpack.HotModuleReplacementPlugin(),
      new WebpackManifestPlugin({
        fileName: "assets.json",
        publicPath: "/",
      }),
    ].filter(Boolean),
  };

  /**
   * Development server that provides live reloading.
   *
   * @see https://webpack.js.org/configuration/dev-server/
   * @type {import("webpack-dev-server").Configuration}
   */
  const devServer = {
    compress: true,
    static: {
      directory: path.resolve(__dirname, "src/public")
    },
    port: 8080,
    historyApiFallback: true,
    hot: true,
    proxy: {
      '/api': {
        target: `${process.env.SERVER_ORIGIN}:${process.env.SERVER_PORT}`,
        secure: false,
        changeOrigin: true
      },
      '/socket.io': {
        target: `ws://localhost:4000`,
        ws: true
      }
    },
  };

  return isDevServer ? { ...appConfig, devServer } : appConfig;
};
