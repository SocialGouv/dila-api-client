import fetchMock, { FetchMock } from "jest-fetch-mock";
import OAuth2 from "simple-oauth2";
import { DilaApiClient } from "./DilaApiClient";

jest.mock("simple-oauth2");

const fetch = fetchMock as FetchMock;
jest.mock("node-fetch", () => fetchMock);

beforeEach(() => {
  (OAuth2.create as jest.Mock).mockReset();
  (fetchMock as jest.Mock).mockReset();
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

test("fetch a new token on 401", async () => {
  fetch.mockResponses(
    [JSON.stringify({ message: "ok" }), { status: 200 }],
    [JSON.stringify({ message: "ok" }), { status: 200 }],
    [
      JSON.stringify({ error: "Unauthorized" }),
      {
        status: 401
      }
    ],
    [JSON.stringify({ message: "ok" }), { status: 200 }],
    [JSON.stringify({ message: "ok" }), { status: 200 }]
  );
  const tokens = ["1234", "5678"];
  let tokenIndex = 0;
  (OAuth2.create as jest.Mock).mockReturnValue({
    accessToken: {
      create: () => {
        const data = { token: { access_token: tokens[tokenIndex % 2] } };
        tokenIndex += 1;
        return data;
      }
    },
    clientCredentials: {
      getToken: () => Promise.resolve("fox")
    }
  });
  const client = new DilaApiClient();

  expect(OAuth2.create).toHaveBeenCalledTimes(0);
  expect(client.globalToken).toEqual(undefined);

  // first call (200)
  await client.fetch({
    params: {},
    path: "whatever"
  });
  expect(OAuth2.create).toHaveBeenCalledTimes(1);
  expect(client.globalToken).toEqual("1234");

  // second call (200), kept the same token
  await client.fetch({
    params: {},
    path: "whatever"
  });
  expect(OAuth2.create).toHaveBeenCalledTimes(1);
  expect(client.globalToken).toEqual("1234");

  // first gets a 401, ask the token then get a 200
  await client.fetch({
    params: {},
    path: "whatever"
  });
  expect(OAuth2.create).toHaveBeenCalledTimes(2);
  expect(client.globalToken).toEqual("5678");

  // this is a 200, kep the last token
  await client.fetch({
    params: {},
    path: "whatever"
  });
  expect(OAuth2.create).toHaveBeenCalledTimes(2);
  expect(client.globalToken).toEqual("5678");
});
