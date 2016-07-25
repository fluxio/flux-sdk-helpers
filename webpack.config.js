const path = require('path');
const webpack = require('webpack');

const webpackConfig = {
  devtool: 'sourcemap',
  output: {
    library: 'FluxHelpers',
    libraryTarget: 'umd',
  },
  module: {
    loaders: [{
      test: /\.js$/,
      include: path.join(__dirname, 'src'),
      loader: 'babel',
    }],
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
  ],
};

module.exports = webpackConfig;
