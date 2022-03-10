const { execSync } = require("child_process");
const { getPages } = require('./common');
getPages().then(({ pages, otherParams }) => {
  const command = `webpack --mode=production --env pages=${pages} otherParams=${otherParams}`;
  execSync(command, { stdio: "inherit" });
})

