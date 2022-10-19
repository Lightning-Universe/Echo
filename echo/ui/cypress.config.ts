import { createWebpackDevConfig } from "@craco/craco";
import { defineConfig } from "cypress";

import cracoConfig from "./craco.config.js";

const webpackConfig = createWebpackDevConfig(cracoConfig);

export default defineConfig({
  env: {
    coverage: true,
  },
  retries: {
    openMode: 0,
    runMode: 3,
  },
  screenshotOnRunFailure: true,
  taskTimeout: 300000,
  trashAssetsBeforeRuns: true,
  viewportHeight: 1080,
  viewportWidth: 1920,
  video: false,
  component: {
    devServer: {
      framework: "react",
      bundler: "webpack",
      webpackConfig,
    },
    setupNodeEvents(on, config) {},
    video: false,
    specPattern: "src/**/*spec.{js,jsx,ts,tsx}",
  },

  e2e: {
    baseUrl: "http://localhost:7501",
    setupNodeEvents(on, config) {},
    specPattern: "cypress/e2e/**/*spec.{js,jsx,ts,tsx}",
    // Need to disable security in order to test <iframe> content
    chromeWebSecurity: false,
  },
});
