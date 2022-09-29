const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
const cssRegex = /\.css$/
const cssModuleRegex = /\.module\.css$/
const lessRegex = /\.less$/
const lessModuleRegex = /\.module\.less$/
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

const rules = ({ isEnvDevelopment }) => [
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
        test: /\.js|jsx$/,
        include: path.resolve(__dirname, '../src'),
        use: [
          {
            loader: 'thread-loader',
            options: {
              worker: 3,
            },
          },
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
              plugins: [isEnvDevelopment ? 'react-refresh/babel' : ''].filter(
                Boolean
              ),
            },
          },
        ],
      },
      {
        test: /\.ts|tsx$/,
        include: path.resolve(__dirname, '../src'),
        use: {
          loader: 'ts-loader',
        },
      },
      // Other resources
      {
        test: /\.(pdf|doc|node|svg)$/,
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
                    .filter((_) => !!_)[0]
                }/assets/file/${url}`
              },
            },
          },
        ],
      },
    ],
  },
]

module.exports = rules
