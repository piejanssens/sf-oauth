const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const process = require('node:process')
const { spawnSync } = require('node:child_process')

const cliPath = path.resolve(__dirname, '../src/cli.js')
const repoRoot = path.resolve(__dirname, '..')
const fixturesDir = path.resolve(__dirname, 'fixtures')

function runCli(args, cwd = repoRoot) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: 'utf-8',
  })
}

test('CLI --help exits successfully', () => {
  const result = runCli(['--help'])

  assert.equal(result.status, 0)
  assert.match(result.stdout, /npmjs\.com\/sf-oauth/)
})

test('CLI unknown argument fails', () => {
  const result = runCli(['--does-not-exist'])

  assert.notEqual(result.status, 0)
  assert.match(result.stdout, /unknown or unexpected option/i)
})

test('CLI --generate fails when required args are missing', () => {
  const result = runCli(['--generate'])

  assert.notEqual(result.status, 0)
  assert.match(result.stdout, /required argument/i)
})

test('CLI --generate --raw returns assertion with fixture test keys', () => {
  const result = runCli([
    '--generate',
    '--raw',
    '--clientId',
    'client-id',
    '--userId',
    'john.doe',
    '--companyId',
    'bestrun',
    '--hostname',
    'example.successfactors.eu',
    '--dir',
    fixturesDir,
  ])

  assert.equal(result.status, 0)
  assert.match(result.stdout.trim(), /^[A-Za-z0-9+/=]+$/)
})
