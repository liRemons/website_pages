const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const cssRegex = /\.css$/
const cssModuleRegex = /\.module\.css$/
const lessRegex = /\.less$/
const lessModuleRegex = /\.module\.less$/
const postcssLoader = {
  loader: 'postcss-loader',
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
        // css
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
        // less
        {
          test: lessModuleRegex,
          exclude: /node_modules/,
          use: isEnvDevelopment
            ? ['style-loader', cssMoudleLoader, postcssLoader, 'less-loader']
            : [
                MiniCssExtractPlugin.loader,
                cssMoudleLoader,
                postcssLoader,
                'less-loader',
              ],
        },
        {
          test: lessRegex,
          exclude: lessModuleRegex,
          use: isEnvDevelopment
            ? ['style-loader', 'css-loader', postcssLoader, 'less-loader']
            : [
                MiniCssExtractPlugin.loader,
                'css-loader',
                postcssLoader,
                'less-loader',
              ],
        },
        // Process images.
        {
          test: /\.(jpg|png|jpeg|gif)$/,
          include: path.resolve(__dirname, '../src'),
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 1024 * 8,
                name: '[name].[ext]',
                esModule: false,
                outputPath: 'static/assets/images',
              },
            },
          ],
        },
        // Static resources in HTML
        {
          test: /\.html$ /,
          include: path.resolve(__dirname, '../src'),
          loader: 'html-loader',
          options: {
            esModule: false,
          },
        },
        {
          test: /\.(js|jsx|json)$/,
          type: 'javascript/auto',
          include: path.resolve(__dirname, '../src'),
          use: [
            {
              loader: 'babel-loader',
              options: {
                // filesystem cache 已覆盖二次构建加速，无需 thread-loader
                cacheDirectory: true,
                presets: ['@babel/preset-env', '@babel/preset-react'],
                plugins: [isEnvDevelopment ? 'react-refresh/babel' : ''].filter(
                  Boolean
                ),
              },
            },
          ],
        },
        {
          test: /\.(ts|tsx)$/,
          include: path.resolve(__dirname, '../src'),
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
                presets: ['@babel/preset-env', '@babel/preset-react'],
                plugins: [isEnvDevelopment ? 'react-refresh/babel' : ''].filter(
                  Boolean
                ),
              },
            },
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
              },
            },
          ],
        },
        // SVG：先用 svgo-loader 压缩，再用 file-loader 输出（通常可减少 30%-60% 体积）
        {
          test: /\.svg$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                outputPath: (url, resourcePath) => {
                  if (resourcePath.includes('apps')) {
                    return `${
                      (resourcePath || '')
                        .replace(/\//g, '_')
                        .replace(/\\/g, '_')
                        .split('apps')[1]
                        .split('_')
                        .filter((_) => !!_)[0]
                    }/assets/file/${url}`
                  }
                  return `assets/file/${url}`
                },
              },
            },
            {
              loader: 'svgo-loader',
              options: {
                plugins: [
                  { name: 'preset-default' },
                  // 保留 viewBox，确保 SVG 可以通过 CSS 控制尺寸
                  { name: 'removeViewBox', active: false },
                ],
              },
            },
          ],
        },
        // Other resources（不含 svg，已单独处理）
        {
          test: /\.(pdf|doc|node)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                outputPath: (url, resourcePath) => {
                  if (resourcePath.includes('apps')) {
                    return `${
                      (resourcePath || '')
                        .replace(/\//g, '_')
                        .replace(/\\/g, '_')
                        .split('apps')[1]
                        .split('_')
                        .filter((_) => !!_)[0]
                    }/assets/file/${url}`
                  }
                  return `assets/file/${url}`
                },
              },
            },
          ],
        },
      ],
    },
  ]
}

module.exports = rules
