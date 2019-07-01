const fetch = require("node-fetch");
const OAuth2 = require("simple-oauth2");
const debug = require("debug")("dila-api-client");

const clientId = process.env.OAUTH_CLIENT_ID;
const clientSecret = process.env.OAUTH_CLIENT_SECRET;

const apiHost =
  "https://sandbox-api.aife.economie.gouv.fr/dila/legifrance/lf-engine-app";
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

  async fetch({ path, method = "POST", params }) {
    const [routeName] = path.split("/").slice(-1);
    const body = JSON.stringify(params);
    debug(`fetching route ${routeName} with ${body}...`);
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
        if (data.error) {
          throw `Error on API fetch: ${JSON.stringify(data)}`;
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
}

module.exports = DilaApiClient;
