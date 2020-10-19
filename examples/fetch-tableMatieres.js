const DilaApi = require("..");

const dilaClient = new DilaApi();

const getTableMatieres = (params) =>
  dilaClient.fetch({
    method: "POST",
    params,
    path: "consult/code/tableMatieres",
  });

const JSONLog = (data) => console.log(JSON.stringify(data, null, 2));

if (require.main === module) {
  getTableMatieres({
    date: new Date().getTime(),
    sctId: "",
    textId: "LEGITEXT000006072050",
  })
    .then(JSONLog)
    .catch(console.log);
}
