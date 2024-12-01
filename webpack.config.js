/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const NodemonPlugin = require("nodemon-webpack-plugin");

function RendererProcessConfigGenerator(env, isRendererOnly) {
  return {
    entry: "./src/renderer/index.tsx",
    target: "electron-renderer",
    mode: env.production === true ? "production" : "development",
    devtool: env.production === true ? "source-map" : "eval", // Ref: https://webpack.js.org/configuration/devtool/#devtool
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: "ts-loader",
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                modules: undefined, // Enable CSS modules for all files matching /\.module\.\w+$/i.test(filename) and /\.icss\.\w+$/i.test(filename) regexp. | Ref: https://webpack.js.org/loaders/css-loader/#modules
                importLoaders: 1, // Run `postcss-loader` on each CSS `@import` and CSS modules/ICSS imports
              }, // Ref: https://webpack.js.org/loaders/postcss-loader/#css-modules
            },
            "postcss-loader",
          ],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: "asset/resource",
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    devServer: {
      static: path.resolve(__dirname, "public"),
      hot: true,
      open: true,
    },
    watchOptions: {
      ignored: /node_modules/,
    },
    output: {
      path: path.resolve(__dirname, "dist/renderer"),
      filename: "bundle.js",
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: "MaxRoom Uploader",
        template: path.join(process.cwd(), "./src/renderer/electron.ejs"),
        favicon: path.join(process.cwd(), "./src/renderer/favicon.ico"),
        scriptLoading: "defer",
      }),
      ...(isRendererOnly === true
        ? [
            new NodemonPlugin({
              exec: "electron .",
              watch: "./dist",
              ext: "js,html,css",
            }),
          ]
        : []),
    ],
  };
}

function MainProcessConfigGenerator(env, isMainOnly) {
  return {
    entry: "./src/main/index.ts",
    target: "electron-main",
    mode: env.production === true ? "production" : "development",
    devtool: env.production === true ? "source-map" : "eval",
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: "ts-loader",
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|mp4)$/i,
          type: "asset/resource",
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    watchOptions: {
      ignored: /node_modules/,
    },
    output: {
      path: path.resolve(__dirname, "dist/main"),
      filename: "bundle.js",
    },
    externals: {
      winston: "commonjs winston",
      "playwright-chromium": "commonjs playwright-chromium",
    },
    plugins:
      isMainOnly === true
        ? [
            new NodemonPlugin({
              exec: "electron .",
              watch: "./dist",
              ext: "js,html,css",
            }),
          ]
        : [],
  };
}

function PreloadConfigGenerator(env, isPreloadOnly) {
  return {
    entry: "./src/main/preload.ts",
    target: "electron-preload",
    mode: env.production === true ? "production" : "development",
    devtool: env.production === true ? "source-map" : "eval",
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: "ts-loader",
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    watchOptions: {
      ignored: /node_modules/,
    },
    output: {
      path: path.resolve(__dirname, "dist/main"),
      filename: "preload.js",
    },
    plugins:
      isPreloadOnly === true
        ? [
            new NodemonPlugin({
              exec: "electron .",
              watch: "./dist",
              ext: "js,html,css",
            }),
          ]
        : [],
  };
}

const ConfigGenerator = (env) => {
  let output = [];
  const isPreloadOnly = env.preload === true && env.renderer !== true && env.main !== true;
  const isMainOnly = env.main === true && env.renderer !== true && env.preload !== true;
  const isRendererOnly = env.renderer === true && env.main !== true && env.preload !== true;
  const isExhaustive = env.renderer === true && env.main === true && env.renderer === true;

  if (isMainOnly === true) {
    output = [MainProcessConfigGenerator(env, isMainOnly)];
  } else if (isRendererOnly === true) {
    output = [RendererProcessConfigGenerator(env, isRendererOnly)];
  } else if (isPreloadOnly === true) {
    output = [PreloadConfigGenerator(env, isPreloadOnly)];
  } else if (isExhaustive === true) {
    output = [
      MainProcessConfigGenerator(env, isMainOnly),
      RendererProcessConfigGenerator(env, isExhaustive), // So that only one nodemon process will run when the outcome is exhaustive
      PreloadConfigGenerator(env, isPreloadOnly),
    ];
  }

  return output;
};

module.exports = ConfigGenerator;
