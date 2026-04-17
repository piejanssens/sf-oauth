const test = require('node:test')
const assert = require('node:assert/strict')

const { createApp } = require('../src/serve')

async function startServer(app) {
  return await new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address()
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` })
    })
  })
}

test('GET /authorize returns HTML form when user_id is missing', async () => {
  const app = createApp({
    generateFn: () => 'unused',
    fetchFn: async () => ({ status: 200, json: async () => ({}) }),
    logFn: { info: () => {}, error: () => {} },
  })

  const { server, baseUrl } = await startServer(app)

  try {
    const response = await fetch(`${baseUrl}/authorize`)
    const html = await response.text()

    assert.equal(response.status, 200)
    assert.match(response.headers.get('content-type') || '', /text\/html/)
    assert.match(html, /SuccessFactors Identification:/)
  } finally {
    server.close()
  }
})

test('POST /authorize returns 400 for missing parameters', async () => {
  const app = createApp({
    generateFn: () => 'unused',
    fetchFn: async () => ({ status: 200, json: async () => ({}) }),
    logFn: { info: () => {}, error: () => {} },
  })

  const { server, baseUrl } = await startServer(app)

  try {
    const response = await fetch(`${baseUrl}/authorize`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ user_id: 'u1' }),
    })

    assert.equal(response.status, 400)
    assert.equal(await response.text(), 'Missing required parameters')
  } finally {
    server.close()
  }
})

test('POST /authorize returns 400 when Postman variables are not resolved', async () => {
  const app = createApp({
    generateFn: () => 'unused',
    fetchFn: async () => ({ status: 200, json: async () => ({}) }),
    logFn: { info: () => {}, error: () => {} },
  })

  const { server, baseUrl } = await startServer(app)

  try {
    const response = await fetch(`${baseUrl}/authorize`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        user_id: '{{user_id}}',
        client_id: 'client',
        scope: 'example.successfactors.eu',
        state: 'acme',
      }),
    })

    assert.equal(response.status, 400)
    assert.match(await response.text(), /Some required parameter is not set/)
  } finally {
    server.close()
  }
})

test('POST /authorize returns token JSON on successful token exchange', async () => {
  const tokenPayload = {
    access_token: 'abc123',
    token_type: 'Bearer',
    expires_in: 3600,
  }

  const app = createApp({
    generateFn: () => 'fake-assertion',
    fetchFn: async () => ({
      status: 200,
      json: async () => tokenPayload,
      statusText: 'OK',
    }),
    logFn: { info: () => {}, error: () => {} },
  })

  const { server, baseUrl } = await startServer(app)

  try {
    const response = await fetch(`${baseUrl}/authorize`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        user_id: 'john.doe',
        client_id: 'client',
        scope: 'example.successfactors.eu',
        state: 'acme',
      }),
    })

    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), tokenPayload)
  } finally {
    server.close()
  }
})

test('GET /authorize redirects when redirect_uri is provided', async () => {
  const app = createApp({
    generateFn: () => 'fake-assertion',
    fetchFn: async () => ({
      status: 200,
      json: async () => ({
        access_token: 'abc123',
        token_type: 'Bearer',
        expires_in: 3600,
      }),
      statusText: 'OK',
    }),
    logFn: { info: () => {}, error: () => {} },
  })

  const { server, baseUrl } = await startServer(app)

  try {
    const response = await fetch(
      `${baseUrl}/authorize?user_id=john.doe&client_id=client&scope=example.successfactors.eu&state=acme&redirect_uri=${encodeURIComponent('https://postman.example/callback')}`,
      {
        redirect: 'manual',
      },
    )

    assert.equal(response.status, 302)
    const location = response.headers.get('location')
    assert.ok(location)
    assert.match(
      location,
      /https:\/\/postman\.example\/callback\?access_token=abc123/,
    )
  } finally {
    server.close()
  }
})
