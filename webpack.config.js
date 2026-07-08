const { Configuration, DefinePlugin } = require('webpack')
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
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin');
const smp = new SpeedMeasurewebpackplugin()

/**
 * @type {Configuration}
 */

const getConfig = ({ isEnvDevelopment, mode, isEnvProduction, pages, otherParams }) => {
  const srcPagesDir = path.resolve(__dirname, 'src/apps/')
  const entry = {};

  if (!otherParams || (!otherParams.br && !otherParams.gzip)) {
    otherParams.br = 'true';
  }

  pages.forEach((el) => (entry[el] = path.resolve(srcPagesDir, el, 'main.jsx')))
  const config = {
    entry,
    mode,
    output: {
      filename: (pathData) => {
        const chunkName = pathData.chunk?.name || '';
        // runtime chunk 输出到 chunks/ 目录
        if (chunkName === 'runtime') return 'chunks/runtime.[contenthash:10].js';
        // entry chunk（页面）输出到各自的 js/ 子目录
        if (pages.includes(chunkName)) return '[name]/js/[contenthash:10].js';
        // 兜底（理论上不会走到这里）
        return 'chunks/[name].[contenthash:10].js';
      },
      path: path.resolve(__dirname, `dist/@${packageJSON.name}`),
      publicPath: `/@${packageJSON.name}/`,
    },
    optimization: {
      // 稳定的 moduleId 策略：新增/删除模块不影响无关 chunk 的 hash，提升浏览器缓存命中率
      moduleIds: 'deterministic',
      // runtime 单独抽出，避免业务代码变动污染 vendor chunk 的 hash
      runtimeChunk: 'single',
      minimize: true,
      minimizer: [
        isEnvProduction &&
          new TerserPlugin({
            // 使用 terser 替代 uglify-js：支持 ES6+，压缩率更高
            terserOptions: {
              compress: {
                drop_console: true,    // 去掉 console.log
                drop_debugger: true,   // 去掉 debugger
                pure_funcs: ['console.log', 'console.info'],
              },
              format: {
                comments: false,       // 去掉所有注释
              },
            },
            extractComments: false,    // 不生成额外的 LICENSE.txt 文件
          }),
      ].filter(Boolean),
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          // antd 及其依赖单独成包，体积大且稳定，有利于长效缓存
          antd: {
            test: /[\\/]node_modules[\\/](antd|@ant-design|rc-[\w-]+)[\\/]/,
            name: 'chunks/vendor-antd',
            chunks: 'all',
            priority: 30,
            reuseExistingChunk: true,
          },
          // react 生态单独成包
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'chunks/vendor-react',
            chunks: 'all',
            priority: 25,
            reuseExistingChunk: true,
          },
          // mobx 状态管理单独成包
          mobx: {
            test: /[\\/]node_modules[\\/](mobx|mobx-react|mobx-react-lite)[\\/]/,
            name: 'chunks/vendor-mobx',
            chunks: 'all',
            priority: 20,
            reuseExistingChunk: true,
          },
          // 其余 node_modules 统一归到 vendor-libs
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'chunks/vendor-libs',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
          },
          // 业务代码中被多页面复用的公共模块
          common: {
            name: 'chunks/common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
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
      new AntdDayjsWebpackPlugin(),
      new DefinePlugin({
        APP_NAME: JSON.stringify(`@${packageJSON.name}`),
      }),
      // 压缩 CSS
      isEnvProduction ? new CssMinimizerPlugin() : null,
      // BundleAnalyzer 仅在 report=true 时才注入，避免每次构建都有开销
      isEnvProduction && otherParams.report === 'true'
        ? new BundleAnalyzerPlugin({ defaultSizes: 'stat', analyzerMode: 'server' })
        : null,
      // gzip 压缩：通过 gzip=true 开启，兼容性最好，适合需要兼容旧浏览器的场景
      // 用法：npm run build gzip=true
      isEnvProduction && otherParams.gzip === 'true'
        ? new CompressionPlugin({
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            filename: '[path][base].gz',
            threshold: 10240,
            minRatio: 0.8,
          })
        : null,
      // brotli 压缩：通过 br=true 开启，压缩率比 gzip 高 15%-25%，现代浏览器均支持
      // 用法：npm run build br=true
      isEnvProduction && otherParams.br === 'true'
        ? new CompressionPlugin({
            algorithm: 'brotliCompress',
            test: /\.(js|css|html|svg)$/,
            filename: '[path][base].br',
            threshold: 10240,
            minRatio: 0.8,
            compressionOptions: {
              level: 11, // brotli 最高压缩级别（0-11）
            },
          })
        : null,
        isEnvDevelopment && new ReactRefreshPlugin(),
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
      https: true,
      client: {
        progress: true,
        overlay: {
          runtimeErrors: (error) => {
            if (error.message === 'ResizeObserver loop completed with undelivered notifications.') {
              return false;
            }
            return true;
          },
        },
      },
    },
    // 并行打包模式下子进程 stdout 的任何输出都会把主进程光标推下去，导致进度条 UI 错位
    // 设为 errors-only，只在构建出错时才输出，正常构建时 stdout 完全静默
    stats: 'errors-only',
    devtool: isEnvDevelopment ? 'eval-source-map' : false,
  }
  return config
}

module.exports = (env, args) => {
  const mode = args.mode
  const isEnvDevelopment = mode === 'development';
  const isEnvProduction = mode === 'production';
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
  });
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
