import fetchMock, { FetchMock } from "jest-fetch-mock";
import OAuth2 from "simple-oauth2";
import { DilaApiClient } from "./DilaApiClient";

jest.mock("simple-oauth2");

const fetch = fetchMock as FetchMock;
jest.mock("node-fetch", () => fetchMock);

beforeEach(() => {
  (OAuth2.create as jest.Mock).mockReset();
});

test("getAccessToken return token for OAuth2 transaction", async () => {
  (OAuth2.create as jest.Mock).mockReturnValue({
    accessToken: {
      create: () => ({
        token: { access_token: 1234 }
      })
    },
    clientCredentials: {
      getToken: () => Promise.resolve("fox")
    }
  });
  const client = new DilaApiClient();

  const token = await client.getAccessToken();

  expect(OAuth2.create).toHaveBeenCalledTimes(1);
  const [[credentials]] = (OAuth2.create as jest.Mock).mock.calls;
  expect(credentials).toMatchInlineSnapshot(`
    Object {
      "auth": Object {
        "authorizePath": "/api/oauth/authorize",
        "tokenHost": "https://oauth.aife.economie.gouv.fr",
        "tokenPath": "/api/oauth/token",
      },
      "client": Object {
        "id": "",
        "secret": "",
      },
      "options": Object {
        "authorizationMethod": "body",
      },
    }
  `);

  expect(token).toBe(1234);
  expect(client.globalToken).toBe(1234);
});

test("getAccessToken return in memory token", async () => {
  const client = new DilaApiClient();
  client.globalToken = "foo";

  const token = await client.getAccessToken();

  expect(OAuth2.create).not.toHaveBeenCalled();
  expect(token).toBe("foo");
  expect(client.globalToken).toBe("foo");
});

test("getAccessToken forward http error", async () => {
  (OAuth2.create as jest.Mock).mockReturnValue({
    clientCredentials: {
      getToken: () => Promise.reject(new Error("418 I'm a teapot"))
    }
  });
  const client = new DilaApiClient();

  expect(client.getAccessToken()).rejects.toThrowErrorMatchingInlineSnapshot(
    `"418 I'm a teapot"`
  );
  expect(client.globalToken).toBeUndefined();
});

//

test("fetch send correct API parameters", async () => {
  fetch.mockResponse(JSON.stringify({ message: "YATTA!" }));
  const client = new DilaApiClient();
  client.globalToken = "token";
  const res = await client.fetch({
    params: {
      date: 1234,
      sctId: "",
      textId: "LEGITEXT000006072050"
    },
    path: "consult/code/tableMatieres"
  });
  expect(res).toMatchInlineSnapshot(`
            Object {
              "message": "YATTA!",
            }
      `);
  expect(fetch.mock.calls.length).toEqual(1);
  const [[url, meta]] = fetch.mock.calls;
  expect(url).toEqual(`${client.apiHost}/consult/code/tableMatieres`);
  expect(meta).toMatchSnapshot();
});

test("fetch forward http error", async () => {
  fetch.mockReject(new Error("404"));
  const client = new DilaApiClient();
  client.globalToken = "token";
  expect(
    client.fetch({
      params: {},
      path: "whatever"
    })
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"404"`);
});

test("fetch forward api error", async () => {
  fetch.mockResponse(JSON.stringify({ error: "YATTA!" }));
  const client = new DilaApiClient();
  client.globalToken = "token";
  expect(
    client.fetch({
      params: {},
      path: "whatever"
    })
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Error on API fetch: {\\"error\\":\\"YATTA!\\"}"`
  );
});
