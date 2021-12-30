const { execSync } = require("child_process");
const { readdirSync } = require("fs");
const pages = process.argv[2] || readdirSync("src/apps").join(',');
if(!pages){
  console.error('未找到目录');
  return;
}
const command = `webpack --mode=production --env pages=${pages}`;
execSync(command, { stdio: "inherit" });
