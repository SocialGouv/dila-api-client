const DilaApi = require("..");
const pAll = require("p-all");

const dilaClient = new DilaApi();

/*
 fetch KALI "conteneur" : a container contains several sections :
  - 0  : texte de base
  - 1+ : textes attachés

this example fetch the whole CCN content from the "conteneur id"

*/

const sortByKey = getter => (a, b) => {
  if (getter(a) < getter(b)) {
    return -1;
  } else if (getter(a) > getter(b)) {
    return 1;
  }
  return 0;
};

const JSONLog = data => console.log(JSON.stringify(data, null, 2));

const getKaliCont = id =>
  dilaClient.fetch({
    path: "consult/kaliCont",
    method: "POST",
    params: {
      id
    }
  });

const getKaliText = id =>
  dilaClient
    .fetch({
      path: "consult/kaliText",
      method: "POST",
      params: {
        id
      }
    })
    // order articles
    .then(text => ({
      ...text,
      articles: text.articles.sort(sortByKey(article => article.intOrdre))
    }));

const isValidNode = node => node.etat !== "ABROGE" && node.etat !== "PERIME";

// filter outdated content and order sections recursively
const filterSortSections = node => ({
  ...node,
  sections: node.sections
    .filter(isValidNode)
    .map(filterSortSections)
    .sort(sortByKey(section => section.intOrdre))
});

// fetch all texts for a given section
// keep original dateModif to apply sort
const fetchSectionTexts = section =>
  pAll(
    section.sections.filter(isValidNode).map(
      text => async () => ({
        ...(await getKaliText(text.id)),
        // keep the dateModif from the kaliCont call, looks more accurate to matche legifrance displa order
        dateModif: text.dateModif
      }),
      {
        concurrency: 5
      }
    )
  );

// embed quali texts for attachés + salaires
// conteneur first section is always "texte de base"
// conteneur following sections are "textes attachées" and "textes salaires"
const embedKaliTexts = async conteneur => ({
  ...conteneur,
  sections: [
    // texte de base (included in original conteneur)
    conteneur.sections[0],
    // textes attaches : fetch each text separately
    ...(await Promise.all(
      conteneur.sections.slice(1).map(section =>
        fetchSectionTexts(section).then(texts => ({
          title: section.title,
          sections: texts.sort(sortByKey(text => new Date(text.dateModif)))
        }))
      )
    ))
  ]
});

// IDCC 1747 - Convention collective nationale des activités industrielles de boulangerie et pâtisserie du 13 juillet 1993.

//
// texte de base for KALICONT000005635691 is KALITEXT000005657284
// conteneur for kali KALITEXT000005657284 is KALICONT000005635691
//
getKaliCont("KALICONT000005635691")
  .then(filterSortSections)
  .then(embedKaliTexts)
  .then(JSONLog)
  .catch(console.log);
