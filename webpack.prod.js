/*global require, module, __dirname */

const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const WorkboxWebpackPlugin = require("workbox-webpack-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const { resolve } = require("path");

const { imageminMinify, imageminGenerate } = ImageMinimizerPlugin;


module.exports = merge(common, {
  mode: "production",
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env"],
            },
          },
        ],
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[path][name].[ext]",
            },
          },
        ],
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: "all",
    },
  },
  plugins: [
    new WorkboxWebpackPlugin.InjectManifest({
      swSrc: resolve(__dirname, "src/scripts/sw.js"),
      swDest: "./sw.bundle.js",
    }),
    new ImageMinimizerPlugin({
      minimizer: {
        implementation: imageminMinify,
        options: {
          plugins: [
            ["mozjpeg", { progressive: true, quality: 75 }],
            ["optipng", { optimizationLevel: 5 }],
            ["gifsicle", { interlaced: false }],
            [
              "svgo",
              {
                plugins: [
                  {
                    name: "removeViewBox",
                    active: false,
                  },
                ],
              },
            ],
          ],
        },
      },
      generator: [
        {
          preset: "webp",
          implementation: imageminGenerate,
          options: {
            plugins: ["imagemin-webp"],
          },
        },
      ],
    }),
  ],
});
