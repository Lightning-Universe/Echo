const path = require("path");
const fs = require("fs");
const cracoBabelLoader = require("craco-babel-loader");

// manage relative paths to packages
const appDirectory = fs.realpathSync(process.cwd());
const resolvePackage = relativePath => path.resolve(appDirectory, relativePath);

const isDev = process.env.NODE_ENV !== "production";
const publicURL = process.env.PUBLIC_URL ?? "";

const webpack = {
  configure: {
    output: {
      // Frontend is served under relative path in production (/root.web_frontend/)
      publicPath: "./",
    },
  },
};

module.exports = {
  // We point to wepback-dev-server (http://localhost:3000) in development
  ...(isDev || publicURL !== "" ? {} : { webpack }),
  plugins: [
    {
      plugin: cracoBabelLoader,
      options: {
        includes: [resolvePackage("node_modules/lightning-ui")],
      },
    },
  ],
};
