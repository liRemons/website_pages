const path = require('path');
const { execSync } = require("child_process");
const { getPages } = require('./common');
const WEBPACK_BIN = process.platform === 'win32'
  ? path.resolve(__dirname, '../node_modules/.bin/webpack.cmd')
  : path.resolve(__dirname, '../node_modules/.bin/webpack');
getPages().then(({ pages, otherParams }) => {
  const command = `"${WEBPACK_BIN}" serve --mode=development --env pages=${pages} otherParams=${otherParams}`;
  execSync(command, { stdio: "inherit", shell: true });
});

