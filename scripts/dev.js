const { execSync } = require("child_process");
const { getPages } = require('./common');
getPages().then(({ pages, otherParams }) => {
  const command = `webpack serve --mode=development --env pages=${pages} otherParams=${otherParams}`;
  execSync(command, { stdio: "inherit" });
})

