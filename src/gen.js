const saml = require('saml').Saml20
const crypto = require('crypto')
const fs = require('fs')
const log = require('./logger')

function generate(
  sClientId,
  sUser,
  sHostname,
  companyId,
  learningOnly,
  iTtl = 600,
  silent = false
) {
  const publicFile = fs.existsSync(`${companyId}-public.pem`)
    ? `${companyId}-public.pem`
    : 'public.pem'
  const privateFile = fs.existsSync(`${companyId}-private.pem`)
    ? `${companyId}-private.pem`
    : 'private.pem'

  if (!fs.existsSync(publicFile) || !fs.existsSync(privateFile)) {
    let msg = `Unable to generate the assertion. No specific matching <companyId>-public.pem and <companyId>-private.pem or generic ${publicFile} and ${privateFile} found.`
    log.error(msg)
    return msg
  }

  !silent &&
    log.info(`Using ${publicFile} and ${privateFile} to generate the assertion`)

  let cert, private
  try {
    cert = fs.readFileSync(publicFile, {
      encoding: 'utf-8',
    })
    private = fs.readFileSync(privateFile, {
      encoding: 'utf-8',
    })
  } catch (error) {
    if (error.code === 'ENOENT') {
      let msg = 'File not found!'
      log.error(msg)
    } else {
      throw error
    }
  }

  let options = {
    cert: cert,
    key: private,
    issuer: 'www.successfactors.com',
    lifetimeInSeconds: iTtl,
    audiences: 'www.successfactors.com',
    attributes: {
      api_key: sClientId,
      use_username: 'false',
      external_user: learningOnly ? 'true' : 'false'
    },
    nameIdentifier: learningOnly ? `${sUser}#DIV#${companyId}` : sUser,
    sessionIndex: crypto.randomUUID(),
    recipient: `https://${sHostname}/oauth/token`,
  }
  return btoa(saml.create(options))
}

function validate(clientId, companyId, assertion, hostname) {
  var params = new URLSearchParams()
  params.append('client_id', clientId)
  params.append('grant_type', 'urn:ietf:params:oauth:grant-type:saml2-bearer')
  params.append('company_id', companyId)
  params.append('assertion', assertion)

  const sTokenUrl = `https://${hostname}/oauth/token`
  const sValidationUrl = `https://${hostname}/oauth/validate`

  log.info(`Requesting a SAML Bearer token - POST ${sTokenUrl}`)
  fetch(sTokenUrl, { method: 'POST', body: params })
    .then(async (response) => {
      const oToken = await response.json()
      log.success('Bearer token received 🎉')
      log.notice(JSON.stringify(oToken))
      log.info(`Validating the token - GET ${sValidationUrl}`)
      return fetch(sValidationUrl, {
        headers: {
          Authorization: `Bearer ${oToken.access_token}`,
        },
      })
    })
    .then((response) => {
      log.success('Token is valid  🎉')
    })
    .catch((error) => {
      log.error(error)
    })
}

module.exports = { generate, validate }
