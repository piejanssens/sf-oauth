const express = require('express')
const { generate } = require('./gen')
var bodyParser = require('body-parser')
const log = require('./logger')

const serve = (port = 3000) => {
  const app = express()
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  app.post('/authorize', async (req, res) => {
    const userId = req.body?.user_id
    const clientId = req.body?.client_id
    const hostname = req.body?.scope
    const companyId = req.body?.state
    const redirectUrl = decodeURI(req.body?.redirect_uri)
    generateToken(req, res, clientId, userId, hostname, companyId, redirectUrl)
  })

  app.get('/authorize', async (req, res) => {
    const userId = req.query?.user_id
    if (!userId) {
      let sHtml = `
        <!doctype html>
        <html>
          <head>
            <style>
              body {
                background: #f2f2f2;
                font-family: 'Open Sans',sans-serif;
                font-size: 14px;
              }

              .pm-main-app-login-success {
                color: #505050;
                line-height: 24px;
                text-align: center;
                margin-top: 100px;
              }

              .pm-main-app-login-success > h1 {
                font-size: 16px;
              }

              .pm-main-app-login-success > p {
                font-size: 14px;
                margin: 0;
              }
            </style>
          </head>
          <body>
            <div class="pm-main-app-login-success ">
            <svg height="100" width="100" version="1.1"  viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     xml:space="preserve">
              <g>
                <g>
                  <path style="fill:#FF4F19;" d="M400.764,402.012l-18.14-108.591h-0.053c-2.519-14.684-12.614-29.89-29.801-34.702
                    c-0.212-0.06-0.424-0.106-0.642-0.137l-42.323-6.351c-0.259-0.039-0.812-0.06-1.077-0.06c-2.677,0-4.935,1.996-5.261,4.655
                    c-2.253,18.298-17.382,32.665-36.85,36.595h-21.241c-19.47-3.93-34.599-18.295-36.847-36.595
                    c-0.332-2.736-2.796-4.794-5.396-4.652c-0.311-0.018-0.616,0.008-0.942,0.057l-42.323,6.351c-0.217,0.031-0.43,0.078-0.642,0.137
                    c-17.188,4.812-27.283,20.019-29.801,34.702h-0.053l-18.14,108.591C107.479,421.731,122.597,440,142.67,440H144h224h1.33
                    C389.403,440,404.52,421.731,400.764,402.012z"/>
                </g>
                <g>
                  <path style="fill:#FDC88E;" d="M256,246.87c-18.52,0-35.322-7.947-47.719-20.791c-0.009,7.698-0.289,18.808-2.33,26.915
                    c1.339,0.818,2.378,2.162,2.58,3.833c2.646,21.529,23.051,37.761,47.469,37.761c24.413,0,44.818-16.235,47.469-37.761
                    c0.206-1.674,1.222-3.015,2.581-3.831c-2.041-8.107-2.322-19.219-2.331-26.917C291.322,238.923,274.519,246.87,256,246.87z"/>
                </g>
                <g>
                  <path style="fill:#FFB980;" d="M302.684,227.056C290.39,239.301,274.025,246.87,256,246.87c-18.52,0-35.322-7.947-47.719-20.791
                    c-0.009,7.698-0.289,18.808-2.33,26.915c1.339,0.818,2.378,2.162,2.58,3.833c1.17,9.516,5.817,17.989,12.74,24.491
                    C253.194,276.822,289.426,245.3,302.684,227.056z"/>
                </g>
                <g>
                  <path style="fill:#FFE1B2;" d="M303.717,114.321h-90.133c-14.617,0-26.51,11.893-26.51,26.51v31.812
                    c0,40.929,30.921,74.227,68.925,74.227s68.925-33.298,68.925-74.227v-37.114C324.925,123.835,315.414,114.321,303.717,114.321z"/>
                </g>
                <g>
                  <path style="fill:#7E5449;" d="M293.113,56h-68.925c-9.972,0-18.355,6.917-20.612,16.204
                    c-18.251,2.32-32.407,17.946-32.407,36.816v26.51c0,13.664,5.801,26.411,15.906,35.47v-30.168c0-14.617,11.893-26.51,26.51-26.51
                    h90.133c11.696,0,21.208,9.514,21.208,21.208v35.464c10.107-9.057,15.906-21.804,15.906-35.464v-31.812
                    C340.831,77.407,319.426,56,293.113,56z"/>
                </g>
                <g>
                  <path style="fill:#D8DCE1;" d="M352,440H160c-4.418,0-8-3.582-8-8V328c0-4.418,3.582-8,8-8h192c4.418,0,8,3.582,8,8v104
                    C360,436.418,356.418,440,352,440z"/>
                </g>
                <g>
                  <g>
                    <path style="fill:#9F6459;" d="M504,456H8c-4.422,0-8-3.582-8-8s3.578-8,8-8h496c4.422,0,8,3.582,8,8S508.422,456,504,456z"/>
                  </g>
                </g>
                <g>
                  <circle style="fill:#FFFFFF;" cx="256" cy="384" r="16"/>
                </g>
              </g>
              </svg>
              <h1>SuccessFactors userId:</h1>
              <form method="post" action="/authorize" autocomplete="on">
                <input type="text" name="user_id" required>
                <input id="client_id" type="hidden" name="client_id">
                <input id="state" type="hidden" name="state">
                <input id="scope" type="hidden" name="scope">
                <input id="redirect_uri" type="hidden" name="redirect_uri">
                <input type="submit" value="Continue">
              </form>
            </div>
            <script>
              const queryString = window.location.search
              const urlParams = new URLSearchParams(queryString)
              document.getElementById('client_id').value = urlParams.get('client_id')
              document.getElementById('state').value = urlParams.get('state')
              document.getElementById('scope').value = urlParams.get('scope')
              document.getElementById('redirect_uri').value = urlParams.get('redirect_uri')
            </script>
          </body>
        </html>`

      res.set('Content-Type', 'text/html')
      res.end(sHtml)
    } else {
      const clientId = req.query?.client_id
      const hostname = req.query?.scope
      const companyId = req.query?.state
      const redirectUrl = decodeURI(req.query?.redirect_uri)
      generateToken(
        req,
        res,
        clientId,
        userId,
        hostname,
        companyId,
        redirectUrl
      )
    }
  })

  app.get('/', async (req, res) => {
    res.status(400).send('Time to take a look at README.md 😉')
  })

  app.listen(port, () => {
    log.info(
      `🚀 SAML Assertion OAuth access token generator listening on port ${port}`
    )
  })
}

async function generateToken(
  req,
  res,
  clientId,
  userId,
  hostname,
  companyId,
  redirectUrl
) {
  let signedAssertionB64 = generate(clientId, userId, hostname, companyId)
  let params = new URLSearchParams()
  params.append('client_id', clientId)
  params.append('grant_type', 'urn:ietf:params:oauth:grant-type:saml2-bearer')
  params.append('company_id', companyId)
  params.append('assertion', signedAssertionB64)

  try {
    const response = await fetch(`https://${hostname}/oauth/token`, {
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
          `${redirectUrl}?access_token=${oToken.access_token}&token_type=${oToken.token_type}&expires_in=${oToken.expires_in}`
        )
      } else {
        res.send(oToken)
      }
    }
  } catch (error) {
    log.error(error)
    res.status(500).send(error.message)
  }
}

module.exports = serve
