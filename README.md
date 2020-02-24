# Dila Api Client

[![NPM][npm-banner]][npm-url]

[![Build Status][travis-image]][travis-url]
[![Pipeline status][gitlab-image]][gitlab-url]
[![NPM version][npm-image]][npm-url]
[![codecov][codecov-image]][codecov-url]
[![jest][jest-image]][jest-url]
![renovate][renovate-image]

> This JS package helps querying the DILA API

## Usage

You need to set two environment variables : `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET`.

These variables are the "oauth identifier" defined in your custom application in the [AIFE portal](https://developer.aife.economie.gouv.fr)

You can also override the variables `API_HOST` (https://api.aife.economie.gouv.fr/dila/legifrance-beta/lf-engine-app) and `TOKEN_HOST` (https://oauth.aife.economie.gouv.fr) for AIFE endpoints.

## Récupérer la table des matières d'un code

```js
const DilaApiClient = require("@socialgouv/dila-api-client");

const dilaApi = new DilaApiClient();

// fetch table des matières code-du-travail
dilaApi
  .fetch({
    path: "consult/code/tableMatieres",
    method: "POST",
    params: {
      date: new Date().getTime(),
      sctId: "",
      textId: "LEGITEXT000006072050"
    }
  })
  .then(console.log);

// fetch list of available codes
dilaApi
  .fetch({
    path: "list/code",
    method: "POST"
  })
  .then(console.log);
```

See also [./examples](./examples)

## Debug

you need to set the `DEBUG=dila-api-client` environment variable in order to see
the output of inner logs.

## Release policy

### Auto

Trigger a custom build on [Travis][travis-url] (in the "More options" right menu) on the `master` branch with a custom config:

```yml
env:
  global:
    - RELEASE=true
```

You can change the lerna arguments though the `LERNA_ARGS` variable.

```yml
env:
  global:
    - STANDARD_VERSION_ARGS="--release-as major"
    - RELEASE=true
```

[codecov-image]: https://codecov.io/gh/SocialGouv/dila-api-client/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/SocialGouv/dila-api-client
[jest-image]: https://jestjs.io/img/jest-badge.svg
[jest-url]: https://github.com/facebook/jest
[gitlab-image]: https://gitlab.factory.social.gouv.fr/SocialGouv/dila-api-client/badges/master/pipeline.svg
[gitlab-url]: https://gitlab.factory.social.gouv.fr/SocialGouv/dila-api-client/commits/master
[npm-banner]: https://nodei.co/npm/@socialgouv/dila-api-client.png?downloads=true&downloadRank=true&stars=true
[npm-image]: http://img.shields.io/npm/v/@socialgouv/dila-api-client.svg
[npm-url]: https://npmjs.org/package/@socialgouv/dila-api-client
[travis-image]: http://travis-ci.com/SocialGouv/dila-api-client.svg?branch=master
[travis-url]: http://travis-ci.com/SocialGouv/dila-api-client
[renovate-image]: https://badges.renovateapi.com/github/SocialGouv/dila-api-client
