/**
 * chalk v5 ESM 兼容层
 * chalk v5 是 ESM-only，在 CommonJS 构建脚本中无法直接使用 require。
 * 本模块提供 chalk v4 兼容的同步 API，使用 ANSI 转义码实现。
 */

const wrap = (code) => (str) => `\x1b[${code}m${str}\x1b[${code === 1 ? 22 : 39}m`;
const bgWrap = (code) => (str) => `\x1b[${code}m${str}\x1b[49m`;

const chalk = {
  red: wrap(31),
  green: wrap(32),
  yellow: wrap(33),
  blue: wrap(34),
  magenta: wrap(35),
  cyan: wrap(36),
  white: wrap(37),
  gray: wrap(90),
  grey: wrap(90),
  dim: wrap(2),
  bold: wrap(1),
  underline: wrap(4),
  bgRed: bgWrap(41),
  bgGreen: bgWrap(42),
  bgYellow: bgWrap(43),
  bgBlue: bgWrap(44),
  bgMagenta: bgWrap(45),
  bgCyan: bgWrap(46),
  bgWhite: bgWrap(47),
  // chalk.bgCyan(chalk.black(...)) 嵌套场景
  black: wrap(30),
};

module.exports = chalk;