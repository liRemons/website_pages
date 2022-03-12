const { execSync } = require("child_process");
const { getPages } = require('./common');
getPages().then(({ pages, otherParams }) => {
  const command = `webpack serve ${(otherParams || '').includes('open=true') ? '--open' : ''} --mode=development --env pages=${pages} otherParams=${otherParams}`;
  execSync(command, { stdio: "inherit" });
})

