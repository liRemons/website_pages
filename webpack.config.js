const { Configuration, DefinePlugin, ProgressPlugin } = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const path = require('path')
const rules = require('./config/rules')
const pagesJSON = require('./scripts/pages.json')
const { js, css } = require('./config/cdn')
const packageJSON = require('./package.json')
/**
 * @type {Configuration}
 */

module.exports = (env, args) => {
  const mode = args.mode
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
      rules,
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
    externals: {
      react: 'React',
      'react-dom': 'ReactDOM',
      antd: 'antd',
      mobx: 'mobx',
      'mobx-react': 'mobxReact',
      classnames: 'classNames',
      axios: 'axios',
      qs: 'Qs',
      'markmap-view': 'markmap',
      'markmap-lib': 'markmap',
      'vditor': 'Vditor'
    },
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
            if (mode === 'production') {
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
          mode === 'production' && otherParams.report === 'true'
            ? 'server'
            : 'disabled',
      }),
      mode === 'production' && otherParams.gzip === 'true'
        ? new CompressionPlugin()
        : null,
    ].filter((_) => !!_),
    devServer: {
      static: {
        directory: path.resolve(__dirname, 'dist'),
      },
      compress: true,
      port: 3033,
      host: 'local-ip',
      open: [`/@${packageJSON.name}/${env.pages.split(',')[0]}`],
      hot: true,
      client: {
        progress: true,
      },
    },
    stats: 'errors-only',
    devtool: mode === 'development' ? 'eval-source-map' : false,
  }
  return config
}
