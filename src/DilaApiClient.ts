import Debug from "debug";
import fetch from "node-fetch";
import OAuth2 from "simple-oauth2";

import { API_HOST, CREDENTIALS, TOKEN_HOST } from "./constants";

const debug = Debug("@socialgouv/dila-api-client");

export class DilaApiClient {
  public globalToken?: string;

  constructor(public apiHost = API_HOST, public tokenHost = TOKEN_HOST) {}

  public async getAccessToken(credentials = CREDENTIALS) {
    if (this.globalToken) {
      return this.globalToken;
    }
    const oauth2 = OAuth2.create(credentials);

    try {
      const result = await oauth2.clientCredentials.getToken({
        scope: "openid",
      });
      const accessToken = oauth2.accessToken.create(result);
      this.globalToken = accessToken.token.access_token;
    } catch (error) {
      debug("error", error);
      debug("Access Token error", error.message);
      throw error;
    }
    return this.globalToken;
  }

  public async fetch({
    path,
    method = "POST",
    params,
  }: {
    path: string;
    method?: string;
    params: object;
  }): Promise<any> {
    const [routeName] = path.split("/").slice(-1);
    const body = JSON.stringify(params);
    debug(`fetching route ${routeName} with ${body}...`);
    const token = await this.getAccessToken();
    const url = `${this.apiHost}/${path}`;

    const data = await fetch(url, {
      body,
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      method,
    }).then((r) => {
      if (r.status === 401 && this.globalToken) {
        this.globalToken = undefined;
        return this.fetch({ method, params, path });
      }
      return r.json();
    });

    if (data.error) {
      throw new Error(`Error on API fetch: ${JSON.stringify(data)}`);
    }

    return data;
  }
}
