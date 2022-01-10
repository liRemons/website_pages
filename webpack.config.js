const { Configuration } = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const ESLintPlugin = require('eslint-webpack-plugin')
const path = require('path')
const rules = require('./config/rules')
const pagesJSON = require('./scripts/pages.json')
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
        chunks: 'async',
        minSize: 20000,
        minRemainingSize: 0,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
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
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@utils': path.resolve(__dirname, 'src/utils'),
      },
    },
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      antd: 'antd',
      mobx: 'mobx',
      'mobx-react': 'mobxReact',
      classnames: 'classNames',
      axios: 'axios',
    },
    plugins: [
      ...pages.map((pageName) => {
        const pageInfo =
          pagesJSON.find((item) => item.pageName === pageName) || {}
        return new HtmlWebpackPlugin({
          filename: `${pageName}/index.html`,
          chunks: [pageName],
          template: path.resolve(__dirname, 'src/index.html'),
          templateParameters: {
            title: `remons.cn - ${pageInfo.title}`,
          },
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
      mode === 'development'
        ? new ESLintPlugin({
            extensions: ['js', 'json', 'jsx'],
            fix: true,
            failOnError: false,
          })
        : '',
    ].filter((_) => !!_),
    devServer: {
      contentBase: path.join(__dirname, 'dist'),
      compress: true,
      port: 3033,
      host: '127.0.0.1',
      open: true,
      openPage: env.pages.split(',')[0],
      hot: true,
    },
    devtool: mode === 'development' ? 'eval-source-map' : 'source-map',
  }

  return config
}
