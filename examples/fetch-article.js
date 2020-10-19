const DilaApi = require("..");

const dilaClient = new DilaApi();

const getArticle = (id) =>
  dilaClient.fetch({
    method: "POST",
    params: {
      id,
    },
    path: "consult/getArticle",
  });

const JSONLog = (data) => console.log(JSON.stringify(data, null, 2));

if (require.main === module) {
  getArticle("LEGIARTI000018124363").then(JSONLog).catch(console.log);
}
