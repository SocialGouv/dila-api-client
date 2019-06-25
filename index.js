const fetch = require("node-fetch");
const OAuth2 = require("simple-oauth2");

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
      console.log("error", error);
      console.log("Access Token error", error.message);
    }
  }

  async apiFetch({ path, method = "POST", body }) {
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
      .catch(e => {
        console.log("ERROR", e);
        console.log({
          url,
          body,
          token
        });

        throw e;
      });

    return data;
  }

  toSection(section) {
    return {
      type: "section",
      data: {
        id: section.id,
        cid: section.cid,
        titre_ta: section.title
      },
      children: [
        ...section.sections.map(this.toSection),
        ...section.articles.map(this.toArticle)
      ]
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

  async fetchKaliConteneur(id) {
    return this.apiFetch({
      path: "dila/legifrance/lf-engine-app/consult/kaliContIdcc",
      body: JSON.stringify({ id })
    });
  }

  async fetchKaliTexte(id) {
    return this.apiFetch({
      path: "dila/legifrance/lf-engine-app/consult/kaliText",
      body: JSON.stringify({ id })
    });
  }

  async fetchArticle(id) {
    // kaliArticle does not seem to work
    return this.apiFetch({
      path: `dila/legifrance/lf-engine-app/consult/getArticle`,
      body: JSON.stringify({ id })
    });
  }

  async fetchCodeTableMatieres(params) {
    return this.apiFetch({
      path: "dila/legifrance/lf-engine-app/consult/code/tableMatieres",
      body: JSON.stringify(params)
    });
  }
}

module.exports = DilaApiClient;
