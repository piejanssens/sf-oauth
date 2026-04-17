const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const process = require('node:process')

const { generate } = require('../src/gen')
const fixturesDir = path.resolve(__dirname, 'fixtures')

test('generate returns a base64 SAML assertion with generic key files', () => {
  const originalCwd = process.cwd()

  try {
    process.chdir(fixturesDir)

    const assertion = generate(
      'client-id',
      'jane.doe',
      'example.successfactors.eu',
      'bestrun',
      false,
      600,
      true,
    )

    assert.ok(assertion)
    assert.match(assertion, /^[A-Za-z0-9+/=]+$/)

    const decoded = Buffer.from(assertion, 'base64').toString('utf-8')
    assert.match(decoded, /successfactors\.com/i)
  } finally {
    process.chdir(originalCwd)
  }
})

test('generate works with company-specific key files', () => {
  const originalCwd = process.cwd()

  try {
    process.chdir(fixturesDir)

    const assertion = generate(
      'client-id',
      'john.doe',
      'example.successfactors.eu',
      'bestrun',
      false,
      600,
      true,
    )

    assert.ok(assertion)
    assert.match(assertion, /^[A-Za-z0-9+/=]+$/)
  } finally {
    process.chdir(originalCwd)
  }
})

test('generate sets learning-only user values in assertion', () => {
  const originalCwd = process.cwd()

  try {
    process.chdir(fixturesDir)

    const assertion = generate(
      'client-id',
      'learning.user',
      'example.successfactors.eu',
      'bestrun',
      true,
      600,
      true,
    )

    assert.ok(assertion)
    const decoded = Buffer.from(assertion, 'base64').toString('utf-8')
    assert.match(decoded, /learning\.user#DIV#bestrun/)
    assert.match(decoded, /external_user/i)
  } finally {
    process.chdir(originalCwd)
  }
})
