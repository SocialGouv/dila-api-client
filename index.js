const fetch = require("node-fetch");
const OAuth2 = require("simple-oauth2");
const debug = require('debug')('dila-api-client')
const serialExec = require("promise-serial-exec");

const clientId = process.env.OAUTH_CLIENT_ID;
const clientSecret = process.env.OAUTH_CLIENT_SECRET;

const apiHost = "https://sandbox-api.aife.economie.gouv.fr";
const tokenHost = "https://sandbox-oauth.aife.economie.gouv.fr";

const credentials = {
  client: {
    id: clientId,
    secret: clientSecret
  },
  auth: {
    tokenHost,
    tokenPath: "/api/oauth/token",
    authorizePath: "/api/oauth/authorize"
  },
  options: {
    authorizationMethod: "body"
  }
};

class DilaApiClient {
  constructor() {
    this.getAccessToken();
  }

  async getAccessToken() {
    if (this.globalToken) {
      return this.globalToken;
    }
    const oauth2 = OAuth2.create(credentials);
    try {
      const result = await oauth2.clientCredentials.getToken({
        scope: "openid"
      });
      const accessToken = oauth2.accessToken.create(result);
      this.globalToken = accessToken.token.access_token;
      return accessToken.token.access_token;
    } catch (error) {
      debug("error", error);
      debug("Access Token error", error.message);
    }
  }

  async apiFetch({ path, method = "POST", params }) {
    const [routeName] = path.split("/").slice(-1)
    const body = JSON.stringify(params)
    debug(`fetching route ${routeName} with ${body}...`)
    const token = await this.getAccessToken();
    const url = `${apiHost}/${path}`;
    const data = await fetch(url, {
      method,
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body
    })
      .then(r => r.json())
      .then(data => {
        if(data.error) {
          throw `Error on API fetch: ${JSON.stringify(data)}`
        } else return data;
      })
      .catch(e => {
        debug("ERROR", e);
        debug({
          url,
          body,
          token
        });

        throw e;
      });

    return data;
  }

  toSection(section) {
    const subSections = section.sections.map(s => this.toSection(s));
    const subArticles = section.articles.map(a => this.toArticle(a));
    return {
      type: "section",
      data: {
        id: section.id,
        cid: section.cid,
        titre_ta: section.title
      },
      children: [...subSections, ...subArticles]
    };
  }

  toArticle(article) {
    return {
      type: "article",
      data: {
        id: article.article.id,
        cid: article.article.cid,
        num: article.article.num,
        nota: article.article.notaHtml,
        bloc_textuel: article.article.texteHtml,
        titre: `Article ${article.article.num}`,
        date_debut: new Date(article.article.dateDebut).toISOString()
      }
    };
  }

  expandChildren(parentObject) {
    return [
      ...parentObject.sections.map(s => this.toSection(s)),
      ...parentObject.articles.map(a => this.toArticle(a))
    ]
  }

  async fetchKaliConteneur({ id, embedArticles }) {
    const conteneur = this.apiFetch({
      path: "dila/legifrance/lf-engine-app/consult/kaliContIdcc",
      params: { id }
    });
    if (embedArticles) {
      return conteneur.then(conteneur => this.embedArticles(conteneur));
    }
    return conteneur;
  }

  async fetchKaliTexte(id) {
    return this.apiFetch({
      path: "dila/legifrance/lf-engine-app/consult/kaliText",
      params: { id }
    });
  }

  async fetchArticle(id) {
    // kaliArticle does not seem to work
    return this.apiFetch({
      path: `dila/legifrance/lf-engine-app/consult/getArticle`,
      params: { id }
    });
  }

  async fetchCodeTableMatieres({ params, embedArticles }) {
    const tbl = this.apiFetch({
      path: "dila/legifrance/lf-engine-app/consult/code/tableMatieres",
      params
    });
    if (embedArticles) {
      return tbl.then(tbl => this.embedArticles(tbl))
    }
    return tbl;
  }

  async fetchObjectIfNecessary(dilaObject, level) {
    if (
      level > 1 &&
      (!dilaObject.articles || dilaObject.articles.length == 0) &&
      (!dilaObject.sections || dilaObject.sections.length == 0) &&
      dilaObject.id.substr(0, 8) === "KALITEXT"
    ) {
      debug(`fetching sub-object ${dilaObject.id}`);
      return await this.fetchKaliTexte(dilaObject.id);
    }
    return dilaObject;
  }

  // embed article details into the section
  async embedArticles(dilaObjectOriginal, level = 0) {
    const dilaObject = await this.fetchObjectIfNecessary(dilaObjectOriginal, level);
    debug(`embedArticles dilaObject ${dilaObject.id}`);
    return {
      ...dilaObject,
      articles:
        (dilaObject.articles &&
          (await Promise.all(
            dilaObject.articles
              .filter(article => article.etat.substr(0, 7) === "VIGUEUR")
              .map(article => this.fetchArticle(article.id))
          ))) ||
        [],
      sections:
        (dilaObject.sections &&
          (await serialExec(
            dilaObject.sections
              .filter(dilaObject => dilaObject.etat.substr(0, 7) === "VIGUEUR")
              .map(dilaObject => () => this.embedArticles(dilaObject, level + 1))
          ))) ||
        []
    };
  }
}

module.exports = DilaApiClient;
