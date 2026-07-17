const fsExtra = require('fs-extra')
const { readdirSync } = require('fs')
const fs = require('fs')
const log4js = require('log4js')
const chalk = require('chalk')
const { logCongfig } = require('./log')
const pakeageJSON = require('../package.json');
const { js, css } = require('../config/cdn')
log4js.configure(logCongfig)

const getPages = () => {
  return new Promise((resolve, reject) => {
    let pages =
      ((process.argv[2] || '').includes('=') ? '' : process.argv[2]) ||
      readdirSync('src/apps').join(',')

    const ignorePages = ['my'];
    pages = pages.split(',').filter(item => !ignorePages.includes(item)).join(',')
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
    // 不在打包前删除旧 dist，避免线上页面在打包期间中断服务
    // 旧产物的替换由 build.js 在每个页面打包完成后原子性地完成
    resolve({ pages, otherParams })
  })
}

const formatSize = (kb) =>
  kb >= 1024 ? `${(kb / 1024).toFixed(2)} mb` : `${kb} kb`

const getDist = (pages) => {
  let filesDir = []
  const readDirSize = (dirPath) => {
    fs.readdir(dirPath, {}, (err, files) => {
      if (files) {
        files.forEach((item) => readDirSize(`${dirPath}/${item}`))
      } else {
        fs.stat(dirPath, (_err, stats) => {
          filesDir.push(`${dirPath.replace('dist', '')}__size__${(stats.size / 1024).toFixed(2)}`)
        })
      }
    })
  }

  readDirSize('dist')
  setTimeout(() => {
    const totalKb = filesDir
      .map((item) => +item.split('__size__')[1])
      .reduce((a, b) => a + b, 0)
      .toFixed(2)

    console.log(`\n  dist 合计 ${chalk.bold(formatSize(+totalKb))}\n`)

    const newFileArr = pages.map((page) => ({
      page,
      files: filesDir
        .sort()
        .filter((item) =>
          item
            .replace(/\//g, '_')
            .replace(/\\/g, '_')
            .split('_')
            .filter(Boolean)
            .includes(page)
        ),
    }))

    // 计算字符串实际显示宽度（中文/全角占 2，其余占 1）
    const displayWidth = (str) => {
      let width = 0
      for (const ch of str) {
        const code = ch.codePointAt(0)
        if (
          (code >= 0x1100 && code <= 0x115F) ||
          (code >= 0x2E80 && code <= 0x303E) ||
          (code >= 0x3040 && code <= 0xA4CF) ||
          (code >= 0xAC00 && code <= 0xD7AF) ||
          (code >= 0xF900 && code <= 0xFAFF) ||
          (code >= 0xFE10 && code <= 0xFE1F) ||
          (code >= 0xFE30 && code <= 0xFE6F) ||
          (code >= 0xFF01 && code <= 0xFF60) ||
          (code >= 0xFFE0 && code <= 0xFFE6)
        ) { width += 2 } else { width += 1 }
      }
      return width
    }

    const padEndW = (str, targetWidth) =>
      str + ' '.repeat(Math.max(0, targetWidth - displayWidth(str)))

    // 预先计算所有应用的行数据，统一列宽
    const LABEL_W = 5
    let globalNameW = 16
    let globalSizeW = 8

    const allAppRows = newFileArr.map(({ page, files }) => {
      const pageKb = files.map((f) => +f.split('__size__')[1]).reduce((a, b) => a + b, 0).toFixed(2)
      const groups = { html: [], js: [], css: [], assets: [] }
      files.forEach((f) => {
        const filePath = f.split('__size__')[0]
        const sizeKb = f.split('__size__')[1]
        if (filePath.endsWith('.js'))        groups.js.push({ filePath, sizeKb })
        else if (filePath.endsWith('.css'))  groups.css.push({ filePath, sizeKb })
        else if (filePath.endsWith('.html')) groups.html.push({ filePath, sizeKb })
        else                                 groups.assets.push({ filePath, sizeKb })
      })
      const rows = []
      const addGroup = (label, items, color) =>
        items.forEach((f) => rows.push({ label, name: f.filePath.split('/').pop(), sizeKb: f.sizeKb, color }))
      addGroup('html', groups.html, chalk.white)
      addGroup('js',   groups.js,   chalk.yellow)
      addGroup('css',  groups.css,  chalk.magenta)
      if (groups.assets.length) {
        const assetsTotalKb = groups.assets.map((f) => +f.sizeKb).reduce((a, b) => a + b, 0).toFixed(2)
        rows.push({ label: 'asset', name: `${groups.assets.length} 个静态文件`, sizeKb: assetsTotalKb, color: chalk.gray })
      }
      // 更新全局列宽
      rows.forEach((r) => {
        globalNameW = Math.min(34, Math.max(globalNameW, displayWidth(r.name) + 2))
        globalSizeW = Math.max(globalSizeW, r.sizeKb.length + 4)
      })
      return { page, pageKb, rows }
    })

    const NAME_W = globalNameW
    const SIZE_W = globalSizeW
    const innerW = LABEL_W + 2 + 1 + NAME_W + 2 + 1 + SIZE_W + 2

    const hLine = (l, m, r, fill) =>
      l + fill.repeat(LABEL_W + 2) + m + fill.repeat(NAME_W + 2) + m + fill.repeat(SIZE_W + 2) + r

    // 渲染所有应用表格（连续，共用边框）
    allAppRows.forEach(({ page, pageKb, rows }, appIdx) => {
      const isFirst = appIdx === 0
      const isLast  = appIdx === allAppRows.length - 1

      // 顶部边框：第一个用 ┌，后续用 ├（与上一个底部合并）
      if (isFirst) {
        console.log('┌' + '─'.repeat(innerW) + '┐')
      } else {
        console.log(hLine('├', '┴', '┤', '─'))
      }

      // 标题行：bgCyan 铺满整行
      const titleLabel = ` ${page} `
      const titleSize  = ` ${formatSize(+pageKb)} `
      const titlePad   = innerW - displayWidth(titleLabel) - displayWidth(titleSize)
      console.log(
        '│' +
        chalk.bgCyan(chalk.black(titleLabel)) +
        chalk.bgCyan(chalk.black(titleSize)) +
        chalk.bgCyan(' '.repeat(Math.max(0, titlePad))) +
        '│'
      )

      // 数据行分隔线
      console.log(hLine('├', '┬', '┤', '─'))

      // 数据行
      rows.forEach(({ label, name, sizeKb, color }) => {
        const truncName = displayWidth(name) > NAME_W ? name.slice(0, NAME_W - 2) + '..' : name
        const col1 = chalk.dim(` ${label.padEnd(LABEL_W)} `)
        const col2 = ` ${color(padEndW(truncName, NAME_W))} `
        const col3 = chalk.gray(` ${sizeKb.padStart(SIZE_W - 3)} kb `)
        console.log(`│${col1}│${col2}│${col3}│`)
      })

      // 最后一个应用才画底部边框
      if (isLast) {
        console.log(hLine('└', '┴', '┘', '─'))
      }
    })
    console.log()

    console.log(chalk.dim('如需查看详细依赖，请执行: npm run build (apps) report=true'))
  }, 100)
}

const setExternals = (isEnvProduction) => {
  return isEnvProduction ? {
    react: 'React',
    'react-dom': 'ReactDOM',
    mobx: 'mobx',
    'mobx-react': 'mobxReact',
    vditor: 'Vditor',
    'vditor/dist/index.css': 'Vditor',
    'antd': 'antd',
    'markdown-it': 'markdownit',
    '@wangeditor/editor': 'wangEditor',
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
      if (item.externalsName === val || item.externalsName.includes(val)) {
        externals_js.push(item.url)
      }
    })
  })
  css.forEach((item) => {
    externalsValues.forEach((val) => {
      if (item.externalsName === val || item.externalsName.includes(val)) {
        externals_css.push(item.url)
      }
    })
  })
  if (isEnvProduction) {
    // 使用 stderr 输出，避免污染主进程 stdout 的光标位置（进度条 UI 依赖 stdout 行数）
    process.stderr.write(`  [${pageInfo.pageName}] cdn/js: ${[...new Set(externals_js)].join(', ')}\n`)
    process.stderr.write(`  [${pageInfo.pageName}] cdn/css: ${[...new Set(externals_css)].join(', ')}\n`)
  }

  return {
    title: `${pageInfo.title}`,
    description: pageInfo.seoContent || pageInfo.description || '',
    keywords: pageInfo.keywords || pageInfo.title || '',
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
