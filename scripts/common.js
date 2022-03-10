const { readdirSync } = require('fs')
const log4js = require('log4js')
const { logCongfig } = require('./log')
log4js.configure(logCongfig)
const getPages = () =>
  new Promise((resolve, reject) => {
    const pages =
      (process.argv[2].includes('=') ? '' : process.argv[2]) ||
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

module.exports = {
  getPages,
}
