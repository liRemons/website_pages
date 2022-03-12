const fsExtra = require('fs-extra');
const { readdirSync } = require('fs');
const fs = require('fs');
const log4js = require('log4js')
const chalk = require('chalk')
const { logCongfig } = require('./log')
log4js.configure(logCongfig)
const getPages = () => new Promise((resolve, reject) => {
  fsExtra.emptydirSync('dist');
  const pages =
    ((process.argv[2] || '').includes('=') ? '' : process.argv[2]) ||
    readdirSync('src/apps').join(',')
  if (!pages) {
    reject('未找到目录')
    return
  }


  const set1 = new Set(pages.split(','))
  const set2 = new Set(readdirSync('src/apps'))
  let difference = new Set([...set1].filter((x) => !set2.has(x)))
  if (difference.size) {
    console.error('识别到以下目录不存在,请检查:')
    reject([...difference].join(','))
    return
  }
  console.log('识别到以下目录：')
  const otherParams =
    process.argv.findIndex((i) => (i || '').includes('=')) !== -1
      ? process.argv.slice(
        process.argv.findIndex((i) => i.includes('=')),
        process.argv.length
      )
      : []
  pages.split(',').forEach((el, index) => console.log(`${index + 1}:`, el))
  resolve({ pages, otherParams })
})

const getDist = () => {
  let filesDir = [];
  const readDirSize = (path) => {
    fs.readdir(path, {}, (err, files) => {
      if (files) {
        files.forEach(item => {
          readDirSize(`${path}/${item}`)
        })
      } else {
        fs.stat(path, (err, stats) => {
          filesDir.push(`${path.replace('dist', '')}__size__${(stats.size / 1024).toFixed(2)}`)
        })
      }
    })
  }

  readDirSize('dist')
  setTimeout(() => {
    const size = filesDir.sort().map(item => +item.split('__size__')[1]).reduce((a, b) => a + b).toFixed(2);
    console.log(`dist: 合计大小 ${size > 1024 ? (size / 1024).toFixed(2) : size} ${size > 1024 ? 'mb' : 'kb'}, 资源如下:`);
    filesDir.sort().forEach(item => {
      console.log(chalk.green(item.split('__size__')[0]), chalk.yellow(`${item.split('__size__')[1]} kb`));
    })
    console.log('如需查看打包详细依赖和大小，请重新执行命令: npm run build (your apps) report=true 或 npm run build report=true');
  }, 100)
}



module.exports = {
  getPages, getDist
}
