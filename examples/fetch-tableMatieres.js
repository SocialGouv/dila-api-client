const { DilaApiClient } = require("../src");

const dilaClient = new DilaApiClient();

const getTableMatieres = params =>
  dilaClient.fetch({
    path: "consult/code/tableMatieres",
    method: "POST",
    params
  });

const JSONLog = data => console.log(JSON.stringify(data, null, 2));

if (require.main === module) {
  getTableMatieres({
    date: new Date().getTime(),
    sctId: "",
    textId: "LEGITEXT000006072050"
  })
    .then(JSONLog)
    .catch(console.log);
}
