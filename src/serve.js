const express = require('express')
const { generate } = require('./gen')
var bodyParser = require('body-parser')
const log = require('./logger')
const fs = require('fs')
const path = require('path')

function parseAuthorizeParams(req) {
  const source = req.body || req.query
  return {
    userId: source?.user_id,
    clientId: source?.client_id,
    hostname: source?.scope,
    companyId: source?.state,
    redirectUrl: source?.redirect_uri
      ? decodeURI(source.redirect_uri)
      : undefined,
  }
}

function validateAuthorizeParams(userId, clientId, hostname, companyId) {
  if (!clientId || !userId || !hostname || !companyId) {
    return { valid: false, error: 'Missing required parameters' }
  }

  if (
    clientId.startsWith('{{') ||
    userId.startsWith('{{') ||
    hostname.startsWith('{{') ||
    companyId.startsWith('{{')
  ) {
    return {
      valid: false,
      error:
        'Some required parameter is not set. Make sure Postman variables have a value set.',
    }
  }

  return { valid: true }
}

const createApp = ({
  generateFn = generate,
  fetchFn = fetch,
  logFn = log,
} = {}) => {
  const app = express()
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  const authorizeHtml = fs.readFileSync(
    path.join(__dirname, 'authorize.html'),
    'utf8',
  )

  app.post('/authorize', async (req, res) => {
    const { userId, clientId, hostname, companyId, redirectUrl } =
      parseAuthorizeParams(req)
    const validation = validateAuthorizeParams(
      userId,
      clientId,
      hostname,
      companyId,
    )
    if (!validation.valid) {
      res.status(400).send(validation.error)
      return
    }
    generateToken(
      req,
      res,
      clientId,
      userId,
      hostname,
      companyId,
      redirectUrl,
      generateFn,
      fetchFn,
      logFn,
    )
  })

  app.get('/authorize', async (req, res) => {
    const { userId, clientId, hostname, companyId, redirectUrl } =
      parseAuthorizeParams(req)
    if (!userId) {
      res.set('Content-Type', 'text/html')
      res.end(authorizeHtml)
    } else {
      const validation = validateAuthorizeParams(
        userId,
        clientId,
        hostname,
        companyId,
      )
      if (!validation.valid) {
        res.status(400).send(validation.error)
        return
      }
      generateToken(
        req,
        res,
        clientId,
        userId,
        hostname,
        companyId,
        redirectUrl,
        generateFn,
        fetchFn,
        logFn,
      )
    }
  })

  app.get('/', async (req, res) => {
    res.redirect('https://npmjs.com/sf-oauth')
  })

  return app
}

const serve = (port = 3000, deps = {}) => {
  const app = createApp(deps)

  const server = app.listen(port, () => {
    ;(deps.logFn || log).info(
      `🚀 SAML Assertion OAuth access token generator listening on http://localhost:${port}`,
    )
  })

  server.on('error', (error) => {
    const logger = deps.logFn || log
    if (error && error.code === 'EADDRINUSE') {
      logger.error(
        `Port ${port} is already in use. Start with a different port using --port <number>.`,
      )
      return
    }

    logger.error(error.message)
  })

  return server
}

async function generateToken(
  req,
  res,
  clientId,
  userId,
  hostname,
  companyId,
  redirectUrl,
  generateFn,
  fetchFn,
  logFn,
) {
  const signedAssertionB64 = generateFn(clientId, userId, hostname, companyId)
  const params = new URLSearchParams()
  params.append('client_id', clientId)
  params.append('grant_type', 'urn:ietf:params:oauth:grant-type:saml2-bearer')
  params.append('company_id', companyId)
  params.append('assertion', signedAssertionB64)

  try {
    const response = await fetchFn(`https://${hostname}/oauth/token`, {
      method: 'POST',
      body: params,
    })
    if (response.status != 200) {
      const oErrorResponse = await response.json()
      const sStatusMessage = oErrorResponse?.errorMessage
        ? oErrorResponse.errorMessage
        : response.statusText
      res.status(response.status).send(sStatusMessage)
    } else {
      const oToken = await response.json()
      if (redirectUrl) {
        res.redirect(
          `${redirectUrl}?access_token=${oToken.access_token}&token_type=${oToken.token_type}&expires_in=${oToken.expires_in}`,
        )
      } else {
        res.send(oToken)
      }
    }
  } catch (error) {
    logFn.error(error)
    res.status(500).send(error.message)
  }
}

module.exports = serve
module.exports.serve = serve
module.exports.createApp = createApp
