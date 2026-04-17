const test = require('node:test')
const assert = require('node:assert/strict')

const serveExport = require('../src/serve')

test('serve module keeps default function export', () => {
  assert.equal(typeof serveExport, 'function')
  assert.equal(typeof serveExport.createApp, 'function')
})
