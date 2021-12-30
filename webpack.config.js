const { Configuration } = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const path = require('path')
const rules = require('./config/rules')
/**
 * @type {Configuration}
 */

module.exports = (env, args) => {
  const mode = args.mode
  const pages = env.pages.split(',')
  const srcPagesDir = path.resolve(__dirname, 'src/apps/')
  const entry = {}
  pages.forEach((el) => (entry[el] = path.resolve(srcPagesDir, el, 'main.jsx')))
  const config = {
    entry,
    mode,
    output: {
      filename: (pathData) => {
        return pages.includes(pathData.runtime)
          ? '[name]/js/[contenthash:10].js'
          : '[name].js'
      },
      path: path.resolve(__dirname, 'dist/'),
      publicPath: '/',
      clean: true,
    },
    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          exclude: /node_modules/,
          uglifyOptions: {
            output: {
              comments: false,
            },
          },
        }),
      ],
      splitChunks: {
        name: 'verdor',
        minSize: 20000,
        maxSize: 1024 * 500,
        chunks: 'all',
        cacheGroups: {
          defaultVendors: {
            filename: '[name].bundle.js',
          },
        },
      },
    },
    module: {
      rules,
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@axios': path.resolve(__dirname, 'src/axios'),
      },
    },
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      antd: 'antd',
      mobx: 'mobx',
      'mobx-react': 'mobxReact',
    },
    plugins: [
      ...pages.map((pageName) => {
        return new HtmlWebpackPlugin({
          filename: `${pageName}/index.html`,
          chunks: [pageName],
          template: path.resolve(__dirname, 'src/index.html'),
        })
      }),
      // 提取单独的CSS
      new MiniCssExtractPlugin({
        filename: '[name]/main.[contenthash:10].css',
      }),
      // 压缩css
      new CssMinimizerPlugin(),
      new CleanWebpackPlugin(),
      // new BundleAnalyzerPlugin({
      //   analyzerMode: mode === 'production' ? 'server' : 'disabled'
      // })
      new ESLintPlugin({
        extensions: ['js', 'json', 'jsx']
      }),
    ],
    devServer: {
      contentBase: path.join(__dirname, 'dist'),
      compress: true,
      port: 3033,
      host: '127.0.0.1',
      open: true,
      openPage: env.pages.split(',')[0],
      hot: true
    },
    devtool: mode === 'development' ? 'eval-source-map' : 'source-map',
  }

  return config
}
