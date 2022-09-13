const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')

const postcssLoader = {
  loader: 'postcss-loader',
}

const cssMoudleLoader = {
  loader: 'css-loader',
  options: {
    sourceMap: false,
    modules: {
      localIdentName: '[path][name]-[local]-[hash:base64:10]',
    },
  },
}

const setRules = ({ isProduction, isDevelopment }) => {
  const rules = [
    {
      oneOf: [
        // css
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, 'css-loader', postcssLoader],
        },
        // less
        {
          test: new RegExp(`^(?!.*\\.global).*\\.less`),
          use: [
            MiniCssExtractPlugin.loader,
            cssMoudleLoader,
            postcssLoader,
            'less-loader',
          ],
        },
        {
          test: new RegExp(`^(.*\\.global).*\\.less`),
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            postcssLoader,
            'less-loader',
          ],
        },
        // Process images.
        {
          test: /\.(jpg|png|jpeg|gif)$/,
          exclude: /node_modules/,
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
          exclude: /node_modules/,
          loader: 'html-loader',
          options: {
            esModule: false,
          },
        },
        {
          test: /\.js|jsx$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: [
                isDevelopment ? require.resolve('react-refresh/babel') : null,
              ].filter(Boolean),
            },
          },
        },
        {
          test: /\.ts|tsx$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
          },
        },
        // Other resources
        {
          test: /\.(pdf|doc|node|svg)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'file-loader',
              options: {
                outputPath: (url, resourcePath) => {
                  console.log(resourcePath)
                  return `${
                    (resourcePath || '')
                      .replace(/\//g, '_')
                      .replace(/\\/g, '_')
                      .split('apps')[1]
                      .split('_')
                      .filter(Boolean)[0]
                  }/assets/file/${url}`
                },
              },
            },
          ],
        },
      ],
    },
  ]

  return rules
}

module.exports = { setRules }
