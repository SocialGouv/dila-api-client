# @socialgouv/dila-api-client

[![NPM][npm-banner]][npm-url]

[![Github Master CI Status][github-image]][github-url]
[![NPM version][npm-image]][npm-url]
[![codecov][codecov-image]][codecov-url]
[![jest][jest-image]][jest-url]
![renovate][renovate-image]

> This JS package helps querying the DILA API

## Usage

You need to set two environment variables : `OAUTH_CLIENT_ID` and `OAUTH_CLIENT_SECRET`.

These variables are the "oauth identifier" defined in your custom application in the [AIFE portal](https://developer.aife.economie.gouv.fr)

### Envs

| Env     | Name                | Value                                                                   |
| ------- | ------------------- | ----------------------------------------------------------------------- |
| *       | OAUTH_CLIENT_ID     | AIFE OAUTH client                                                       |
| *       | OAUTH_CLIENT_SECRET | AIFE OAUTH secret                                                       |
| Prod    | API_HOST            | https://api.piste.gouv.fr/dila/legifrance/lf-engine-app                 |
| Prod    | TOKEN_HOST          | https://oauth.piste.gouv.fr/api/oauth/token                             |
| Sandbox | API_HOST            | https://sandbox-api.piste.gouv.fr/dila/legifrance/lf-engine-app         |
| Sandbox | TOKEN_HOST          | https://sandbox-oauth.aife.economie.gouv.fr/api/oauth/token             |

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
      textId: "LEGITEXT000006072050",
    },
  })
  .then(console.log);

// fetch list of available codes
dilaApi
  .fetch({
    path: "list/code",
    method: "POST",
  })
  .then(console.log);
```

See also [./examples](./examples)

## Debug

you need to set the `DEBUG=*` environment variable in order to see
the output of inner logs.

## Release policy

Releases are automaticly made through our [GitHub Actions][github-url] strictly following the [Semantic Versioning](http://semver.org/) specification thanks to [semantic-release](https://github.com/semantic-release/semantic-release).


[codecov-image]: https://codecov.io/gh/SocialGouv/dila-api-client/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/SocialGouv/dila-api-client
[github-image]: https://github.com/SocialGouv/dila-api-client/workflows/main/badge.svg?branch=master
[github-url]: https://github.com/SocialGouv/dila-api-client/actions/
[jest-image]: https://jestjs.io/img/jest-badge.svg
[jest-url]: https://github.com/facebook/jest
[npm-banner]: https://nodei.co/npm/@socialgouv/dila-api-client.png?downloads=true&downloadRank=true&stars=true
[npm-image]: http://img.shields.io/npm/v/@socialgouv/dila-api-client.svg
[npm-url]: https://npmjs.org/package/@socialgouv/dila-api-client
[renovate-image]: https://badges.renovateapi.com/github/SocialGouv/dila-api-client

