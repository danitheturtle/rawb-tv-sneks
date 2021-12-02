const os = require("os");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const minimist = require("minimist");

const args = minimist(process.argv.slice(2));
const envName = args.env || minimist(args._).env || "development";
const resolve = (filename) => path.resolve(__dirname, filename);

/**
 * Loads environment variables from .env files.
 */
module.exports.loadEnv = function loadEnv(envName) {
  try {
    const env = [
      dotenv.config({ path: resolve(`.env`) }).parsed,
      dotenv.config({ path: resolve(`.env.${envName}`) }).parsed
    ].reduce((acc, parsed) => ({ ...acc, ...parsed }), {});
    // Default application version
    if (!env.VERSION) {
      env.VERSION = os.userInfo().username;
    }
    Object.assign(process.env, env);
    return { ...env };
  } catch (e) {
    console.error(e);
    console.log('issue with env config files, assuming environment was already set up')
  }
};

module.exports.loadEnv(envName)
