const { js } = require('../../config/cdn')
const { readdirSync } = require('fs')
const { Configuration } = require('webpack')

const getConfig = ({ isEnvDevelopment, mode, isEnvProduction, pages, otherParams }) => {
  // ... (keep existing logic)

  return {
    // ... (keep existing config)
    optimization: {
      // ... (keep existing optimization)
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          // 启用 antd 独立分包
          antd: {
            test: /[\\/]node_modules[\\/](antd|@ant-design|rc-[\w-]+)[\\/]/,
            name: 'chunks/vendor-antd',
            chunks: 'all',
            priority: 30,
            reuseExistingChunk: true,
          },
          // 启用 react 生态独立分包
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
            name: 'chunks/vendor-react',
            chunks: 'all',
            priority: 25,
            reuseExistingChunk: true,
          },
          // 启用 mobx 独立分包
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
    // ... (keep rest of config)
  }
}

module.exports = (env, args) => {
  // ... (keep existing logic)
}
