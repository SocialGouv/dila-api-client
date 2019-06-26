# dila-api-client

This JS package helps querying the DILA API

## Usage

## Récupérer la table des matières d'un code

```js
const DilaApiClient = require("dila-api-client");

const dilaApi = new DilaApiClient();

dilaApi.fetchCodeTableMatieres({
  date: new Date().getTime(),
  sctId: "",
  textId: "LEGITEXT000006072050"
}).then(console.log)

```
 
## Other API calls 

```js
dilaApi.apiFetch({
  path: 'dila/legifrance/lf-engine-app/list/code'
  method: 'POST,
  params: {
    test: 42
  }
}).then(console.log)
```
