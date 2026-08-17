const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')

const cssRegex = /\.css$/
const cssModuleRegex = /\.module\.css$/
const lessRegex = /\.less$/
const lessModuleRegex = /\.module\.less$/
const postcssLoader = { loader: 'postcss-loader' }

// 提取公共 outputPath 函数，避免重复
const getOutputPath = (pathData) => {
  const resourcePath = pathData.filename || ''
  const basename = path.basename(resourcePath)
  if (resourcePath.includes('apps')) {
    const prefix = resourcePath
      .replace(/\//g, '_')
      .replace(/\\/g, '_')
      .split('apps')[1]
      .split('_')
      .filter((_) => !!_)[0]
    return `${prefix}/assets/file/${basename}`
  }
  return `assets/file/${basename}`
}

const rules = ({ isEnvDevelopment }) => {
  const cssMoudleLoader = {
    loader: 'css-loader',
    options: {
      sourceMap: false,
      modules: {
        localIdentName: isEnvDevelopment
          ? '[path][name]-[local]'
          : '[hash:base64:10]',
      },
    },
  }

  return [
    {
      oneOf: [
        // ---- CSS ----
        {
          test: cssRegex,
          exclude: cssModuleRegex,
          use: isEnvDevelopment
            ? ['style-loader', 'css-loader', postcssLoader]
            : [MiniCssExtractPlugin.loader, 'css-loader', postcssLoader],
        },
        {
          test: cssModuleRegex,
          exclude: /node_modules/,
          use: isEnvDevelopment
            ? ['style-loader', cssMoudleLoader, postcssLoader]
            : [MiniCssExtractPlugin.loader, cssMoudleLoader, postcssLoader],
        },

        // ---- Less ----
        {
          test: lessModuleRegex,
          exclude: /node_modules/,
          use: isEnvDevelopment
            ? ['style-loader', cssMoudleLoader, postcssLoader, 'less-loader']
            : [MiniCssExtractPlugin.loader, cssMoudleLoader, postcssLoader, 'less-loader'],
        },
        {
          test: lessRegex,
          exclude: lessModuleRegex,
          use: isEnvDevelopment
            ? ['style-loader', 'css-loader', postcssLoader, 'less-loader']
            : [MiniCssExtractPlugin.loader, 'css-loader', postcssLoader, 'less-loader'],
        },

        // ---- 图片（替代 url-loader）----
        {
          test: /\.(jpg|png|jpeg|gif|webp)$/,
          include: path.resolve(__dirname, '../src'),
          type: 'asset',
          parser: { dataUrlCondition: { maxSize: 1024 * 8 } },
          generator: { filename: 'static/assets/images/[name].[ext]' },
        },

        // ---- HTML ----
        {
          test: /\.html$/,
          include: path.resolve(__dirname, '../src'),
          loader: 'html-loader',
          options: { esModule: false },
        },
        {
          test: /\.(js|jsx|ts|tsx)$/,
          include: path.resolve(__dirname, '../src'),
          use: [
            isEnvDevelopment && {
              loader: require.resolve('@pmmmwh/react-refresh-webpack-plugin/loader'),
            },
            {
              loader: 'esbuild-loader',
              options: {
                loader: 'tsx',
                target: 'es2017',
                jsx: 'automatic',
              },
            },
          ],
        },

        // ---- SVG（替代 file-loader，保留 svgo 压缩）----
        {
          test: /\.svg$/,
          type: 'asset/resource',
          generator: { filename: getOutputPath },
          use: [
            {
              loader: 'svgo-loader',
              options: {
                plugins: [
                  { name: 'preset-default' },
                  { name: 'removeViewBox', active: false },
                ],
              },
            },
          ],
        },

        // ---- Markdown（替代 raw-loader）----
        {
          test: /\.md$/,
          type: 'asset/source',
        },

        // ---- 其他资源（替代 file-loader）----
        {
          test: /\.(pdf|doc|node)$/,
          type: 'asset/resource',
          generator: { filename: getOutputPath },
        },
      ],
    },
  ]
}

module.exports = rules