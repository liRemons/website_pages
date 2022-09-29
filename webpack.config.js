const { Configuration, DefinePlugin, ProgressPlugin } = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const path = require('path')
const rules = require('./config/rules')
const pagesJSON = require('./scripts/pages.json')
const packageJSON = require('./package.json')
const { setExternals, templateParameters } = require('./scripts/common')
const SpeedMeasurewebpackplugin = require('speed-measure-webpack-plugin')
const smp = new SpeedMeasurewebpackplugin()

/**
 * @type {Configuration}
 */

const getConfig = ({ isEnvDevelopment, mode, isEnvProduction, pages, otherParams }) => {
  const srcPagesDir = path.resolve(__dirname, 'src/apps/')
  const entry = {}

  console.log('正在编译以下应用', pages)
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
      path: path.resolve(__dirname, `dist/@${packageJSON.name}`),
      publicPath: `/@${packageJSON.name}/`,
    },
    optimization: {
      minimize: true,
      minimizer: [
        isEnvProduction &&
          new TerserPlugin({
            minify: (file, sourceMap) => {
              const uglifyJsOptions = {
                sourceMap: false,
              }
              return require('uglify-js').minify(file, uglifyJsOptions)
            },
          }),
      ].filter(Boolean),
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
    cache: {
      type: 'filesystem',
    },
    module: {
      rules: rules({ isEnvDevelopment }),
    },
    resolve: {
      extensions: ['.js', '.jsx', '.tsx', '.ts'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@axios': path.resolve(__dirname, 'src/axios'),
        '@assets': path.resolve(__dirname, 'src/assets'),
        '@utils': path.resolve(__dirname, 'src/utils'),
      },
    },
    externals: setExternals(isEnvProduction),
    plugins: [
      ...pages.map((pageName) => {
        const pageInfo =
          pagesJSON.find((item) => item.pageName === pageName) || {}
        return new HtmlWebpackPlugin({
          filename: `${pageName}/index.html`,
          chunks: [pageName],
          template: path.resolve(__dirname, 'src/index.html'),
          templateParameters: (compilation, assets, assetTags, options) =>
            templateParameters({
              compilation,
              assets,
              assetTags,
              options,
              isEnvProduction,
              pageInfo,
            }),
        })
      }),

      new ProgressPlugin({
        activeModules: true,
        modules: true,
      }),
      new DefinePlugin({
        APP_NAME: JSON.stringify(`@${packageJSON.name}`),
      }),
      // 压缩css
      isEnvProduction ? new CssMinimizerPlugin() : null,
      new BundleAnalyzerPlugin({
        defaultSizes: 'stat',
        analyzerMode:
          isEnvProduction && otherParams.report === 'true'
            ? 'server'
            : 'disabled',
      }),
      isEnvProduction && otherParams.gzip === 'true'
        ? new CompressionPlugin()
        : null,
      new ReactRefreshPlugin(),
    ].filter(Boolean),
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'dist'),
      },
      compress: true,
      host: 'local-ip',
      allowedHosts: 'auto',
      open: [`/@${packageJSON.name}/${pages[0]}`],
      hot: true,
      client: {
        progress: true,
      },
    },
    stats: 'normal',
    devtool: isEnvDevelopment ? 'eval-source-map' : false,
  }
  return config
}

module.exports = (env, args) => {
  const mode = args.mode
  const isEnvDevelopment = mode === 'development'
  const isEnvProduction = mode === 'production'
  const pages = env.pages.split(',')
  const otherParams = {}
  ;(env.otherParams || '').split(',').forEach((item) => {
    otherParams[item.split('=')[0]] = item.split('=')[1]
  })
  const webpackConfig = getConfig({
    isEnvDevelopment,
    mode,
    isEnvProduction,
    pages,
    otherParams
  })
  const config = otherParams.speed === 'true' ? smp.wrap(webpackConfig) : webpackConfig;
  config.plugins.push(
    // 提取单独的CSS
    new MiniCssExtractPlugin({
      filename: isEnvDevelopment
        ? '[name]/main.css'
        : '[name]/main.[contenthash:10].css',
    })
  )
  return config
}
