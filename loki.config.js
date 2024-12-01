/* eslint-disable no-undef */

// Ref: https://github.com/oblador/loki/tree/master/examples/react
module.exports = {
  // Engine use for image testing
  diffingEngine: "pixelmatch",
  // Screen configuration for Screenshot
  configurations: {
    "chrome.laptop": {
      target: "chrome.docker",
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false,
    },
    "chrome.iphone7": {
      target: "chrome.docker",
      preset: "iPhone 7",
    },
  },
};
