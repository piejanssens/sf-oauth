const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const process = require('node:process')
const { spawnSync } = require('node:child_process')

const loggerPath = path.resolve(__dirname, '../src/logger.js')

const helperScript = `
const log = require(${JSON.stringify(loggerPath)});
log.error('boom');
console.log('unreachable');
`

test('logger.error exits with non-zero status', () => {
  const result = spawnSync(process.execPath, ['-e', helperScript], {
    encoding: 'utf-8',
  })

  assert.notEqual(result.status, 0)
  assert.match(result.stdout, /boom/)
  assert.doesNotMatch(result.stdout, /unreachable/)
})
