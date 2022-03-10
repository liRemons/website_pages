const path = require('path');

const logCongfig = {
  appenders: {
    // 控制台输出
    console: { type: 'console' },
    // 全部日志文件
    app: { 
      type: 'file', 
      filename: path.join(__dirname, '../logs/app'),
      maxLogSize: 1024 * 500, //一个文件的大小，超出后会自动新生成一个文件
      backups: 2, // 备份的文件数量
      pattern: "_yyyy-MM-dd.log",
      alwaysIncludePattern: true,
    },
    // 错误日志文件
    errorFile: { 
      type: 'file',
      filename: path.join(__dirname, '../logs/error'),
      maxLogSize: 1024 * 500, // 一个文件的大小，超出后会自动新生成一个文件
      backups: 2, // 备份的文件数量
      pattern: "_yyyy-MM-dd.log",
      alwaysIncludePattern: true,
    }
  },
  categories: {
    // 默认日志，输出debug 及以上级别的日志
    default: { appenders: [ 
      'app', 
      'console' // 不向控制台输出 
    ], level: 'debug' },
    // 错误日志，输出error 及以上级别的日志
    error: { appenders: [ 'errorFile' ], level: 'error' },
  },
  replaceConsole: true,   // 替换console.log  
};


module.exports = {
  logCongfig
}