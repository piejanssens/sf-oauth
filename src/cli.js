#!/usr/bin/env node

const arg = require('arg')
const { exit, cwd } = require('process')
const child_process = require('child_process')

const fs = require('fs')
const { generate, validate } = require('./gen')

const log = require('./logger')
const { sign } = require('crypto')

let args

try {
  args = arg({
    // Types
    '--help': Boolean,
    '--generate': Boolean,
    '--newkeypair': Boolean,
    '--clientId': String,
    '--userId': String,
    '--companyId': String,
    '--hostname': String,
    '--validate': Boolean,
    '--ttl': Number,
    '--port': Number,
    '--raw': Boolean,
    '--dir': String,
    // Aliases
    '-g': '--generate',
    '-n': '--newkeypair',
    '-c': '--clientId',
    '-u': '--userId',
    '-i': '--companyId',
    '-h': '--hostname',
    '-v': '--validate',
    '-t': '--ttl',
    '-p': '--port',
    '-r': '--raw',
    '-d': '--dir',
  })
} catch (err) {
  if (err.code === 'ARG_UNKNOWN_OPTION') {
    log.error(err.message)
  } else {
    throw err
  }
}

if (args['--dir']) {
  process.chdir(args['--dir'])
}

if (!args['--raw']) {
  log.info(`ℹ️  PEM files directory is set to ${cwd()}`)
}

if (args['--help']) {
  log.info('See README.md')
  exit(0)
}

if (args['--generate']) {
  if (!args['--hostname']) {
    log.error(
      'SF API hostname is a required argument, provide `--hostname XXX`'
    )
  }

  if (!args['--clientId']) {
    log.error(
      'OAuth client API key is a required argument, provide `--clientId XXX`'
    )
  }

  if (!args['--userId']) {
    log.error('userId is a required argument, either provide `--userId XXX`')
  }

  if (!args['--companyId']) {
    log.error('companyId is a required argument, provide --companyId XXX`')
  }

  const clientId = args['--clientId']
  const userId = args['--userId']
  const hostname = args['--hostname']
  const companyId = args['--companyId']

  const signedAssertionB64 = generate(
    clientId,
    userId,
    hostname,
    companyId,
    args['--ttl'],
    args['--raw']
  )

  if (args['--raw']) {
    console.log(signedAssertionB64)
    exit(0)
  }

  log.notice(signedAssertionB64)

  if (args['--validate']) {
    validate(clientId, companyId, signedAssertionB64, hostname)
  }
} else if (args['--newkeypair']) {
  if (!args['--companyId']) {
    log.info(
      'ℹ️  You can pass argument --companyId for convenience store the key pair as <companyId>-private.pem and <companyId>-public.pem'
    )
  }

  const publicFile = args['--companyId']
    ? `${args['--companyId']}-public.pem`
    : 'public.pem'
  const privateFile = args['--companyId']
    ? `${args['--companyId']}-private.pem`
    : 'private.pem'

  if (fs.existsSync(publicFile) || fs.existsSync(privateFile)) {
    log.error(
      `File ${publicFile} and/or ${privateFile} arleady exists in ${cwd()}`
    )
  }

  child_process.spawnSync(
    'openssl',
    ['genrsa', '-out', `${cwd()}/${privateFile}`, 2048],
    { stdio: 'inherit' }
  )

  child_process.spawnSync(
    'openssl',
    [
      'req',
      '-new',
      '-x509',
      '-key',
      `${cwd()}/${privateFile}`,
      '-out',
      `${cwd()}/${publicFile}`,
      '-days',
      360,
    ],
    { stdio: 'inherit' }
  )
} else if (args['--validate']) {
  if (!args['--companyId']) {
    log.info(
      `ℹ️  You can pass argument --companyId to validate a specific SF companyId public certificate with the name '<companyId>-public.pem'.`
    )
  }

  const publicFile = args['--companyId']
    ? `${args['--companyId']}-public.pem`
    : 'public.pem'

  if (!fs.existsSync(publicFile)) {
    log.error(`File ${publicFile} does not exist in ${cwd()}`)
  }

  child_process.spawnSync(
    'openssl',
    ['x509', '-in', `${cwd()}/${publicFile}`, '-noout', '-enddate'],
    { stdio: 'inherit' }
  )
} else {
  log.info(
    `ℹ️  Check the README.md for instructions on how this can be used in combination with Postman`
  )
  const serve = require('./serve')
  serve(args['--port'])
}
