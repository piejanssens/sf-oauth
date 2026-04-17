# OAuth 2.0 SAML Assertion Access Token Generator for SAP SuccessFactors HCM

[![Latest Release](https://img.shields.io/github/v/release/piejanssens/sf-oauth?label=latest%20release)](https://github.com/piejanssens/sf-oauth/releases/latest)
[![Test Status](https://github.com/piejanssens/sf-oauth/actions/workflows/test.yml/badge.svg)](https://github.com/piejanssens/sf-oauth/actions/workflows/test.yml)
[![npm](https://img.shields.io/npm/v/sf-oauth?label=npm)](https://www.npmjs.com/package/sf-oauth)
[![npm downloads](https://img.shields.io/npm/dm/sf-oauth?label=downloads)](https://www.npmjs.com/package/sf-oauth)
[![License](https://img.shields.io/github/license/piejanssens/sf-oauth)](LICENSE)
[![Node Version](https://img.shields.io/node/v/sf-oauth)](https://www.npmjs.com/package/sf-oauth)
[![semantic-release](https://img.shields.io/badge/semantic--release-enabled-brightgreen)](https://github.com/semantic-release/semantic-release)

This utility can generate and validate key pairs, generate SAML assertions accepted by SuccessFactors `/oauth/token` endpoint and integrate with Postman (which lacks support for the OAuth 2.0 SAML bearer assertion flow).

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Quick Start](#quick-start)
- [Generate a new key pair](#generate-a-new-key-pair)
- [Create or update the OAuth client in SuccessFactors](#create-or-update-the-oauth-client-in-successfactors)
- [Run a web service returning OAuth access tokens](#run-a-web-service-returning-oauth-access-tokens)
- [Browser Form](#browser-form)
- [Usage with Postman](#usage-with-postman)
- [Generate via CLI](#generate-via-cli)
- [Argument Aliases](#argument-aliases)
- [Check the OAuth client certificate's validity](#check-the-oauth-client-certificates-validity)
- [Learning Only Users](#learning-only-users)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Sponsorship](#sponsorship)

## Features

- Generate RSA key pairs for SAML assertion signing
- Generate SAML bearer assertions accepted by the SuccessFactors OAuth token endpoint
- Run a local web service to request access tokens interactively from the browser
- Identify users by either `userId` or `username`
- Support learning-only users
- Reuse company-specific key pairs when available
- Keep a recent identifier history in the browser form for faster repeated use
- Integrate with Postman for OAuth 2.0 flows that Postman does not support natively

## Prerequisites

- NodeJS >= 18
- OpenSSL

## Installation

```shell
$ npm i -g sf-oauth
```

## Usage

> ⚠️ Once installed, you can run the command `sf-oauth` from a terminal shell. Either pass the `--dir` argument to specify the directory (to be) containing the PEM files, or run from within that directory.

### Quick Start

1. Generate a key pair with `sf-oauth --newkeypair`
2. Upload the generated public certificate to the SuccessFactors OAuth client configuration
3. Start the local helper with `sf-oauth --dir <pem-directory>`
4. Open the `/authorize` endpoint from your browser or call it directly from Postman

### Generate a new key pair

```console
$ sf-oauth --newkeypair
...
```

Provide sensible information for the certificate, for example:

> ---
>
> Country Name (2 letter code) [AU]:BE<br>
> State or Province Name (full name) [Some-State]:Antwerp<br>
> Locality Name (eg, city) []:Antwerp<br>
> Organization Name (eg, company) [Internet Widgits Pty Ltd]:Example LTD<br>
> Organizational Unit Name (eg, section) []:HRT<br>
> Common Name (e.g. server FQDN or YOUR name) []:Pieter Janssens<br>
> Email Address []:piejanssens@example.com<br>

### Create or update the OAuth client in SuccessFactors

1. Go to OAuth Clients
2. Create new or edit an existing client
3. Provide a descriptive name - e.g. "Postman Pieter Janssens"
4. Copy the contents of `...public.pem`, paste in SF and save
5. Copy the OAuth client API key (e.g. to use as client ID in the Postman configuration)

### Run a web service returning OAuth access tokens

Run the command without any arguments:

```shell
$ sf-oauth [--port]
ℹ️  PEM files directory is set to /X/Y/Z/SF Secret Keypairs
ℹ️  Check the README.md for instructions on how this can be used in combination with Postman
🚀 SAML Assertion OAuth access token generator listening on port 3000
```

| method | path         | purpose                                                                                                                                         | body/query parameters                                                              |
| ------ | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| GET    | `/authorize` | requests to supply identifier via your browser, generates SAML assertion, requests OAuth access token from SF and then returns the access token | `client_id`, `scope`, `state`, `learning_only` (optional)                          |
| POST   | `/authorize` | immediately generates SAML assertion, requests OAuth access token from SF and then returns the access token                                     | `user_id` or `username`, `client_id`, `scope`, `state`, `learning_only` (optional) |

> ⚠️ If a specific keypair with the name '<companyId>-public.pem' and '<companyId>-private.pem' is present, this will be used to generate the SAML assertion. If not, by default it will use 'public.pem' and 'private.pem'.

### Browser Form

When you open `GET /authorize` without a `user_id`, the app renders a browser form that helps you complete the token request.

The form supports:

- Choosing between `User ID` and `Username`
- Entering the identifier manually or selecting one from recent history
- Marking the request as `Learning Only User`
- Reusing up to 20 recent identifiers stored in the browser's local storage

The recent identifiers are shown in a list on the right side of the page and can be clicked to populate the identifier input.

### Usage with Postman

![Postman demo](docs/postman_demo.gif)

For each SF instance, create a separate Postman environment specifying the following variables:

- hostname: hostname of SF API
- company_id: SF instance ID
- client_id: SuccessFactors OAuth client API key

In any collection or folder, set up 'Authorization' to `OAuth 2.0` and configure the like shown as follows:

![Postman config](./docs/postman_config.png)

> **Remember** to select the correct Postman environment prior to requesting a new OAuth access token. As long as the token remains valid you can select different tokens that are held by Postman without the need to generate/request a new one.

### Generate via CLI

```shell
$ sf-oauth --generate --companyId <SF Company ID> --hostname <SF API hostname> --clientId <OAuth client API key> (--userId <userId> | --username <username>) [--ttl <assertion validity in seconds>] [--learningOnly]

SAML Assertion...

base64 encoded SAML Assertion
```

Optional parameters:

- `--dir`: directory containing the PEM files. If omitted, the current working directory is used.
- `--ttl`: validity of the assertion in seconds (600 by default)
- `--validate`: will request a bearer access token and validate it on by calling the SF OData API, this requires the argument `--companyId` to be provided as well.
- `--raw`: will output the base64 encoded string only. This can be used in scripting or piping. For example 🪄 `$ sf-oauth --generate --companyId ... --raw | base64 -d`

For user identification, provide exactly one of these:

- `--userId`: use the SuccessFactors user ID
- `--username`: use the SuccessFactors username

Example of generating a SAML assertion, requisting an access token with it and finally testing the access token by calling the SuccessFactors OData API:

```shell
$ sf-oauth --generate --companyId salesDemoXYZ --hostname apisalesdemo2.successfactors.eu --clientId NzNkYzk0NTljMTQ0NWEyOWMxNzUwYjdhOTdkOA --username piejanssens@example.com  --ttl 3600 --validate
Requesting a SAML Bearer token...
Bearer token received 🎉
{
  access_token: 'eyJ0b2tlbkNvbnRlbnQiOnsiYXBpS2V5IjoiTnpOa1l6azBOVGxqTVRRME5XRXlPV014TnpVd1lqZGhPVGRrT0EiLCJzZlByaW5jaXBsZSI6IjEwMzI2NiNESVYjU0ZDUEFSVDAwMDUxMiIsImlzc3VlZEZvciI6InBqX25vZGVqcyIsInNjb3BlIjoiIiwiaXNzdWVkQXQiOjE2NDc1MTI0NDU4OTIsImV4cGlyZXNBdCI6MTY0NzU5ODg0NTg5Mn0sInNpZ25hdHVyZSI6IklQSTEvbGh3dGtIeXFQTml0bzNIL05DL3hzSjFSMHBYM3hMOCt0RWlFN29OYnhveFVOc1lUOUlyMnorZlUxN0JEcFc2eWhHU1dPaERHRjJjUTQ3dVZGNHJGLzd2cXRPTlZGbWdvK2NGTDBNSUsxS1Axck1BK29DM0paU1ZOL2RTaWFzWXJUb1BrdnBkZ3BGcHN0U2VYc3lvajFxWTdVL1daSllhbDZzakd4WT0ifQ==',
  token_type: 'Bearer',
  expires_in: 85949
}
Validating the token...
Token is valid  🎉
```

#### Argument Aliases

| alias | argument       |
| ----- | -------------- |
| -g    | --generate     |
| -n    | --newkeypair   |
| -c    | --clientId     |
| -u    | --userId       |
| -U    | --username     |
| -i    | --companyId    |
| -h    | --hostname     |
| -v    | --validate     |
| -t    | --ttl          |
| -p    | --port         |
| -r    | --raw          |
| -d    | --dir          |
| -l    | --learningOnly |

### Check the OAuth client certificate's validity

```shell
$ sf-oauth --validate [--companyId]
notAfter=Mar  6 13:37:03 2032 GMT
```

### Learning Only Users

The SuccessFactors Learning OAuth token server is deprecated. Instead, you can use the SuccessFactors Platform token server to generate OAuth tokens even if the user does not exist in Employee Profile or Employee Central, a so-called learning-only user.

**Via CLI:** Use the `-l` or `--learningOnly` argument.

**Via Web Form:** When using the `/authorize` endpoint, check the "Learning Only User" checkbox.

Example:
```shell
$ sf-oauth --generate --companyId salesDemoXYZ --hostname apisalesdemo2.successfactors.eu --clientId <key> --userId <user> --learningOnly
```

### Testing

Run the automated tests locally with:

```shell
npm test
```

The test suite uses dummy key pairs stored in `test/fixtures/*.pem` for assertion generation tests.

GitHub Actions runs the same test command on every pull request and on pushes to `master`.

### Troubleshooting

#### The CLI or server cannot find PEM files

Make sure you either run `sf-oauth` from the directory containing the PEM files or pass `--dir <pem-directory>` explicitly.

Expected files are:

- `public.pem` and `private.pem`, or
- `<companyId>-public.pem` and `<companyId>-private.pem`

#### SuccessFactors rejects the SAML assertion or token request

Check these items first:

- The OAuth client in SuccessFactors contains the correct public certificate
- The `client_id` matches the OAuth client API key from SuccessFactors
- The hostname points to the correct SuccessFactors API domain
- The certificate is still valid and not expired

You can inspect certificate validity with:

```shell
sf-oauth --validate [--companyId <SF Company ID>]
```

#### Postman sends unresolved variables like `{{client_id}}`

This usually means the wrong Postman environment is selected or one of the required variables is missing.

Verify that your active environment defines:

- `hostname`
- `company_id`
- `client_id`

#### The wrong user is used for token generation

Choose exactly one identifier type:

- `--userId` for a SuccessFactors user ID
- `--username` for a SuccessFactors username

In the browser form, select the matching radio option before submitting.

#### Learning-only user requests fail

If the user does not exist in Employee Profile or Employee Central, enable learning-only mode:

- In the CLI, add `--learningOnly`
- In the browser form, check `Learning Only User`

#### Port 3000 is already in use

Start the local server on a different port:

```shell
sf-oauth --port 3001
```

## Contributing

Contributions are more than welcome! Please open an issue or a pull request.

ℹ️ To be able to execture the Node cli commands on your forked source code, run `npm link` from the root folder project.

## Sponsorship

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/M4M7694D5)
