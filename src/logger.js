const clc = require('cli-color')
const { exit } = require('process')

const errorColor = clc.red.bold
const warnColor = clc.xterm(202)
const noticeColor = clc.yellow
const infoColor = clc.cyanBright
const successColor = clc.greenBright

const error = (msg) => {
  console.log(errorColor(msg))
  exit(-1)
}

const warning = (msg) => {
  console.log(warnColor(msg))
}

const notice = (msg) => {
  console.log(noticeColor(msg))
}

const info = (msg) => {
  console.log(infoColor(msg))
}

const success = (msg) => {
  console.log(successColor(msg))
}

module.exports = { error, warning, info, notice, success }
