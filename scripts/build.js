const { execSync } = require("child_process");
const { getPages, getDist } = require('./common');
getPages().then(({ pages, otherParams }) => {
  if ((otherParams || '').includes('report=true')) {
    const command = `webpack --mode=production --env pages=${pages} otherParams=${otherParams}`;
    execSync(command, { stdio: "inherit" });
    getDist();
  } else {
    pages.split(',').forEach((page, index) => {
      const command = `webpack --mode=production --env pages=${page} otherParams=${otherParams}`;
      execSync(command, { stdio: "inherit" });
      console.log([page], '打包完成', `共 ${pages.split(',').length} 个应用，当前已打包 ${index + 1} 个`);
      if (index === pages.split(',').length - 1) {
        console.log('========所有应用已打包完成========');
        getDist();
      }
    })
  }
})

