const { Configuration, DefinePlugin, ProgressPlugin } = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const path = require('path')
const { setRules } = require('./config/rules')
const pagesJSON = require('./scripts/pages.json')
const { js, css } = require('./config/cdn')
const packageJSON = require('./package.json')
/**
 * @type {Configuration}
 */

const setExternals = (isProduction) => {
  return isProduction
    ? {
        react: 'React',
        'react-dom': 'ReactDOM',
        antd: 'antd',
        'antd/dist/antd.css': 'antd',
        mobx: 'mobx',
        'mobx-react': 'mobxReact',
        classnames: 'classNames',
        axios: 'axios',
        qs: 'Qs',
        'markmap-view': 'markmap',
        'markmap-lib': 'markmap',
        vditor: 'Vditor',
        'vditor/dist/index.css': 'Vditor',
      }
    : {}
}

module.exports = (env, args) => {
  const mode = args.mode
  const isProduction = mode === 'production'
  const isDevelopment = mode === 'development'
  const pages = env.pages.split(',')
  const srcPagesDir = path.resolve(__dirname, 'src/apps/')
  const entry = {}
  const otherParams = {}
  ;(env.otherParams || '').split(',').forEach((item) => {
    otherParams[item.split('=')[0]] = item.split('=')[1]
  })
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
        new TerserPlugin({
          minify: (file, sourceMap) => {
            const uglifyJsOptions = {
              sourceMap: false,
            }
            return require('uglify-js').minify(file, uglifyJsOptions)
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
      rules: setRules({ isDevelopment, isProduction }),
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
    cache: {
      type: 'filesystem',
    },
    externals: setExternals(isProduction),
    plugins: [
      ...pages.map((pageName) => {
        const pageInfo =
          pagesJSON.find((item) => item.pageName === pageName) || {}
        return new HtmlWebpackPlugin({
          filename: `${pageName}/index.html`,
          chunks: [pageName],
          template: path.resolve(__dirname, 'src/index.html'),
          templateParameters: (compilation, assets, assetTags, options) => {
            const externals_js = []
            const externals_css = []
            const externalsValues = []
            for (let [key, value] of compilation._modules.entries()) {
              if (key.includes('external')) {
                externalsValues.push(value.userRequest)
              }
            }

            js.forEach((item) => {
              externalsValues.forEach((val) => {
                if (item.externalsName === val) {
                  externals_js.push(item.url)
                }
              })
            })
            css.forEach((item) => {
              externalsValues.forEach((val) => {
                if (item.externalsName === val) {
                  externals_css.push(item.url)
                }
              })
            })
            if (isProduction) {
              console.log('---------------------------------')
              console.log(`正在写入模板 页面：${pageName}/index.html:  cdn/js`)
              console.log(externals_js)
              console.log(`正在写入模板 页面：${pageName}/index.html:  cdn/css`)
              console.log(externals_css)
              console.log('---------------------------------')
            }

            return {
              title: `remons.cn - ${pageInfo.title}`,
              externals_js: [...new Set(externals_js)],
              externals_css: [...new Set(externals_css)],
            }
          },
        })
      }),
      new ReactRefreshPlugin(),
      new ProgressPlugin({
        activeModules: true,
        modules: true,
      }),
      // 提取单独的CSS
      new MiniCssExtractPlugin({
        filename: '[name]/main.[contenthash:10].css',
      }),
      new DefinePlugin({
        APP_NAME: JSON.stringify(`@${packageJSON.name}`),
      }),
      // 压缩css
      new CssMinimizerPlugin(),
      new BundleAnalyzerPlugin({
        defaultSizes: 'stat',
        analyzerMode:
          isProduction && otherParams.report === 'true' ? 'server' : 'disabled',
      }),
      isProduction && otherParams.gzip === 'true'
        ? new CompressionPlugin()
        : null,
    ].filter(Boolean),
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'dist'),
      },
      open: [`/@${packageJSON.name}/${env.pages.split(',')[0]}`],
      hot: true,
      client: {
        progress: true,
      },
    },
    stats: 'errors-only',
    devtool: isDevelopment ? 'eval-source-map' : false,
  }
  return config
}
