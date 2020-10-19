const fs = require("fs");
const pAll = require("p-all");

const DilaApi = require("..");

const dilaClient = new DilaApi();

/*
  fetch KALI "conteneur" : a container contains several sections :
  - 0  : texte de base
  - 1+ : textes attachés

this example fetch the whole CCN content from the "conteneur id"

*/

const sortByKey = (getter) => (a, b) => {
  if (getter(a) < getter(b)) {
    return -1;
  } else if (getter(a) > getter(b)) {
    return 1;
  }
  return 0;
};

const JSONLog = (data) => console.log(JSON.stringify(data, null, 2));

const isValidSection = (node) =>
  node.etat !== "ABROGE" && node.etat !== "PERIME";

const getKaliCont = (id) =>
  dilaClient.fetch({
    method: "POST",
    params: {
      id,
    },
    path: "consult/kaliCont",
  });

const getKaliText = (id, tries = 0) =>
  dilaClient
    .fetch({
      method: "POST",
      params: {
        id,
      },
      path: "consult/kaliText",
    })
    // order articles
    .then((text) => ({
      ...text,
      articles: text.articles.sort(sortByKey((article) => article.intOrdre)),
    }))
    // retry
    .catch((e) => {
      console.log(`getKaliText ${id} ${tries + 1}/3`);
      if (tries < 3) {
        return getKaliText(id, tries + 1);
      }
      throw e;
    });

const numify = (id) => parseInt(id.replace(/^KALIARTI/, ""));

// the API returns all the version of a given article. we pick the latest one
const isValidArticle = (current, index, articles) => {
  const maxVersion = Math.max(
    ...articles
      .filter(
        (article) => article.cid === current.cid && article.id !== current.id
      )
      .map((article) => numify(article.id)),
    0
  );
  return numify(current.id) > maxVersion;
};

// filter and sort outdated content and order sections recursively
const filterSections = (node) => ({
  ...node,
  articles: (node.articles && node.articles.filter(isValidArticle)) || [],
  sections: node.sections
    .filter(isValidSection)
    .map(filterSections)
    .sort(sortByKey((section) => section.intOrdre)),
});

// fetch the section texts if any
// keep original dateModif to apply sort
const fetchSectionTexts = (section) =>
  pAll(
    section.sections.filter(isValidSection).map((text) => async () => ({
      ...((text.id.match(/^KALITEXT/) && (await getKaliText(text.id))) || text),
      // keep the dateModif from the kaliCont call, looks more accurate to match legifrance display order
      dateModif: text.dateModif,
    })),
    {
      concurrency: 3,
    }
  );

// embed kali texts for attachés + salaires
// conteneur first section is always "texte de base"
// conteneur following sections are "textes attachées" and "textes salaires" but are not provided initially in the conteneur data
const embedKaliTexts = async (conteneur) => ({
  ...conteneur,
  sections: [
    // texte de base (included in original conteneur)
    conteneur.sections[0],
    // textes attaches : fetch each text separately
    ...(await Promise.all(
      conteneur.sections.slice(1).map((section) =>
        fetchSectionTexts(section).then((texts) => ({
          sections: texts.sort(sortByKey((text) => new Date(text.dateModif))),
          title: section.title,
        }))
      )
    )),
  ],
});

const fetchCCN = (id) =>
  getKaliCont(id).then(filterSections).then(embedKaliTexts);

// fetch all conventions from this fixed list
const conventions = require("../kali.json");

// for each convention, fetch convention conteneur, populate conteneur texts, and ouput to JSON file.
pAll(
  conventions.map((convention) => () => {
    const filePath = `./ccns/${convention.id}.json`;
    if (fs.existsSync(filePath)) {
      console.log(`skip ${filePath}`);
      return Promise.resolve();
    }
    console.log(`fetch ${convention.id}`);
    return fetchCCN(convention.id)
      .then((data) => {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`wrote ${filePath}`);
      })
      .catch(console.log);
  }),
  { concurrency: 1 }
)
  .then(() => console.log("done !"))
  .catch(console.log);

// IDCC 1747 - Convention collective nationale des activités industrielles de boulangerie et pâtisserie du 13 juillet 1993.

//
// texte de base for KALICONT000005635691 is KALITEXT000005657284
// conteneur for kali KALITEXT000005657284 is KALICONT000005635691
//
// KALICONT000005635173 = syntec
// fetchCCN("KALICONT000005635173")
//   .then(JSONLog)
//   .catch(console.log);
