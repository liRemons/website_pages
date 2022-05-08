const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const path = require('path')
// test: the applied rule.
// exclude: ignore processed files.
// use: multiple loaders can be used to run from bottom to top.

// Handle compatibility
const postcssLoader = {
  loader: 'postcss-loader',
  // options: {
  // postcssOptions: {
  // plugins: [["postcss-preset-env", {}]]
  // },
  // },
}

const cssMoudleLoader = {
  loader: 'css-loader',
  options: {
    modules: {
      localIdentName: '[path][name]-[local]-[hash:base64:10]',
    },
  },
}

const rules = [
  {
    oneOf: [
      // css
      {
        test: /\.css$/,
        include: path.resolve(__dirname, '../src'),
        // MiniCssExtractPlugin.loader plug-in extracts css as a separate file.
        // Unlike style-loader, style-loader inserts css into the style tag.
        use: [MiniCssExtractPlugin.loader, 'css-loader', postcssLoader],
      },
      // less
      {
        test: new RegExp(`^(?!.*\\.global).*\\.less`),
        include: path.resolve(__dirname, '../src'),
        include: path.resolve(__dirname, '../src'),
        use: [
          MiniCssExtractPlugin.loader,
          cssMoudleLoader,
          postcssLoader,
          'less-loader',
        ],
      },
      {
        test: new RegExp(`^(.*\\.global).*\\.less`),
        include: path.resolve(__dirname, '../src'),
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
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
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
                return `${
                  (resourcePath || '')
                    .replace(/\//g, '_')
                    .replace(/\\/g, '_')
                    .split('apps')[1] || ''
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
