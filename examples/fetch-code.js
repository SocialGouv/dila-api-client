const DilaApi = require("..");

const dilaClient = new DilaApi();

/*
  fetch a full code from table des matieres and add all individual articles
*/

const tableMatieres = (params) =>
  dilaClient.fetch({
    method: "POST",
    params,
    path: "consult/code/tableMatieres",
  });

const getArticle = (id) =>
  dilaClient.fetch({
    method: "POST",
    params: {
      id,
    },
    path: "consult/getArticle",
  });

const JSONLog = (data) => console.log(JSON.stringify(data, null, 2));

// embed article details into the section
const embedArticles = async (section) => ({
  ...section,
  articles: await Promise.all(
    section.articles
      .filter((article) => article.etat === "VIGUEUR")
      .map(
        (article) =>
          console.log(`getArticle ${article.id}`) || getArticle(article.id)
      )
  ),
  sections: await Promise.all(
    section.sections
      .filter((section) => section.etat === "VIGUEUR")
      .map(
        (section) =>
          console.log(`embedArticles section ${section.id}`) ||
          embedArticles(section)
      )
  ),
});

// get structure + content
const getFullCode = (params) =>
  tableMatieres(params).then((tbl) => console.log(tbl) || embedArticles(tbl));

// get full code from DILA, then slimify the file. from 229Mb to 19Mb
const getCode = (id) =>
  getFullCode({
    date: new Date().getTime(),
    sctId: "",
    textId: id,
  }).then((code) => ({
    children: [...code.sections, ...code.articles],
    data: {
      cid: id,
      titre: "Code du travail",
      titrefull: "Code du travail",
    },
    type: "code",
  }));

if (require.main === module) {
  getCode("LEGITEXT000006072050").then(JSONLog).catch(console.log);
}
