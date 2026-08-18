const autoprefixer = require('autoprefixer');
const postcssPresetEnv = require('postcss-preset-env');

module.exports = {
  plugins: [
    autoprefixer({
      overrideBrowserslist: [
        "> 1%",
        "last 2 versions"
      ],
    }),
    postcssPresetEnv(),
  ],
};
