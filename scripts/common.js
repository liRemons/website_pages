const fsExtra = require('fs-extra')
const { readdirSync } = require('fs')
const fs = require('fs')
const log4js = require('log4js')
const chalk = require('chalk')
const { logCongfig } = require('./log')
const pakeageJSON = require('../package.json');
const { js, css } = require('../config/cdn')
log4js.configure(logCongfig)

const deletePath = (pages) =>
  Promise.all(
    pages.map((item) => fsExtra.remove(`dist/@${pakeageJSON.name}/${item}`))
  )

const getPages = () => {
  return new Promise(async (resolve, reject) => {
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
    await deletePath(pages.split(','))
    resolve({ pages, otherParams })
  })
}

const getDist = (pages) => {
  let filesDir = []
  const readDirSize = (path) => {
    fs.readdir(path, {}, (err, files) => {
      if (files) {
        files.forEach((item) => {
          readDirSize(`${path}/${item}`)
        })
      } else {
        fs.stat(path, (err, stats) => {
          filesDir.push(
            `${path.replace('dist', '')}__size__${(stats.size / 1024).toFixed(
              2
            )}`
          )
        })
      }
    })
  }

  readDirSize('dist')
  setTimeout(() => {
    const size = filesDir
      .map((item) => +item.split('__size__')[1])
      .reduce((a, b) => a + b)
      .toFixed(2)
    console.log(
      `dist: 合计大小 ${size > 1024 ? (size / 1024).toFixed(2) : size} ${
        size > 1024 ? 'mb' : 'kb'
      }, 资源如下:`
    )
    const newFileArr = pages.map((page) => {
      return {
        page,
        files: filesDir
          .sort()
          .map((item) => {
            if (
              item
                .replace(/\//g, '_')
                .replace(/\\/g, '_')
                .split('_')
                .filter((_) => !!_)
                .includes(page)
            ) {
              return item
            }
          })
          .filter((_) => !!_),
      }
    })
    newFileArr.forEach((item) => {
      console.log(chalk.green(' '))
      const filesSize = item.files
        .map((item) => +item.split('__size__')[1])
        .reduce((a, b) => a + b)
        .toFixed(2)
      console.log(
        chalk.bgGreen(
          chalk.black(
            ` ${item.page}:`,
            `${filesSize > 1024 ? (filesSize / 1024).toFixed(2) : filesSize} ${
              filesSize > 1024 ? 'mb' : 'kb'
            } `
          )
        )
      )
      item.files.forEach((el) => {
        console.log(
          chalk.green(el.split('__size__')[0]),
          chalk.yellow(`${el.split('__size__')[1]} kb`)
        )
      })
    })
    console.log(
      '如需查看打包详细依赖和大小，请重新执行命令: npm run build (your apps) report=true 或 npm run build report=true'
    )
  }, 100)
}

const setExternals = (isEnvProduction) => {
  return isEnvProduction ? {
    react: 'React',
    'react-dom': 'ReactDOM',
    antd: 'antd',
    'antd/dist/antd.css': 'antd',
    mobx: 'mobx',
    'mobx-react': 'mobxReact',
    classnames: 'classNames',
    axios: 'axios',
    qs: 'Qs',
    'markmap-view': 'markmap',
    'markmap-lib': 'markmap',
    vditor: 'Vditor',
    'vditor/dist/index.css': 'Vditor',
  } : {};
}

const templateParameters = ({ compilation, assets, assetTags, options, pageInfo, isEnvProduction }) => {
  const externals_js = []
  const externals_css = []
  const externalsValues = []
  for (let [key, value] of compilation._modules.entries()) {
    if (key.includes('external')) {
      externalsValues.push(value.userRequest)
    }
  }

  js.forEach((item) => {
    externalsValues.forEach((val) => {
      if (item.externalsName === val) {
        externals_js.push(item.url)
      }
    })
  })
  css.forEach((item) => {
    externalsValues.forEach((val) => {
      if (item.externalsName === val) {
        externals_css.push(item.url)
      }
    })
  })
  if (isEnvProduction) {
    console.log('---------------------------------')
    console.log(`正在写入模板 页面：${pageName}/index.html:  cdn/js`)
    console.log(externals_js)
    console.log(`正在写入模板 页面：${pageName}/index.html:  cdn/css`)
    console.log(externals_css)
    console.log('---------------------------------')
  }

  return {
    title: `${pakeageJSON.title} - ${pageInfo.title}`,
    externals_js: [...new Set(externals_js)],
    externals_css: [...new Set(externals_css)],
  }
}

module.exports = {
  getPages,
  getDist,
  setExternals,
  templateParameters
}
