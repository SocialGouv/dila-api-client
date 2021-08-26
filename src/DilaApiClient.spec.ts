import { AccessToken, ClientCredentials } from "simple-oauth2";
import { DilaApiClient } from "./DilaApiClient";
import { test, expect, beforeEach } from "@jest/globals";

const mockFetch = jest.fn<Promise<any>, []>(() => Promise.reject());

jest.mock("simple-oauth2");
jest.mock("node-fetch", () => ({
  __esModule: true, // this property makes it work
  default: (...args: []) => mockFetch(...args),
}));

beforeEach(() => {
  jest.resetAllMocks();
  mockFetch.mockRestore();
});
test("getAccessToken return token for OAuth2 transaction", async () => {
  ClientCredentials.prototype.getToken = jest.fn(() =>
    Promise.resolve({ token: { access_token: 1234 } } as any as AccessToken)
  );

  const client = new DilaApiClient();
  const token = await client.getAccessToken();
  expect(token).toBe(1234);
  expect(client.globalToken).toBe(1234);
});

test("getAccessToken return in memory token", async () => {
  const client = new DilaApiClient();
  client.globalToken = "foo";

  const token = await client.getAccessToken();

  expect(ClientCredentials.prototype.getToken).not.toHaveBeenCalled();
  expect(token).toBe("foo");
  expect(client.globalToken).toBe("foo");
});

test("getAccessToken forward http error", async () => {
  ClientCredentials.prototype.getToken = jest.fn(() =>
    Promise.reject(new Error("418 I'm a teapot"))
  );

  const client = new DilaApiClient();

  expect(client.getAccessToken()).rejects.toThrowErrorMatchingInlineSnapshot(
    `"418 I'm a teapot"`
  );
  expect(client.globalToken).toBeUndefined();
});

//

test("fetch send correct API parameters", async () => {
  mockFetch.mockImplementation(() =>
    Promise.resolve({ json: () => ({ message: "YATTA!" }) })
  );

  const client = new DilaApiClient();
  client.globalToken = "token";
  const res = await client.fetch({
    params: {
      date: 1234,
      sctId: "",
      textId: "LEGITEXT000006072050",
    },
    path: "consult/code/tableMatieres",
  });
  expect(res).toMatchInlineSnapshot(`
Object {
  "message": "YATTA!",
}
`);
  expect(mockFetch).toHaveBeenCalled();
  expect(mockFetch.mock.calls).toMatchInlineSnapshot(`
Array [
  Array [
    "https://api.aife.economie.gouv.fr/dila/legifrance-beta/lf-engine-app/consult/code/tableMatieres",
    Object {
      "body": "{\\"date\\":1234,\\"sctId\\":\\"\\",\\"textId\\":\\"LEGITEXT000006072050\\"}",
      "headers": Object {
        "Authorization": "Bearer token",
        "content-type": "application/json",
      },
      "method": "POST",
    },
  ],
]
`);
});

test("fetch forward http error", async () => {
  mockFetch.mockImplementation(() => Promise.reject(new Error("404")));

  const client = new DilaApiClient();
  client.globalToken = "token";
  expect(
    client.fetch({
      params: {},
      path: "whatever",
    })
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"404"`);
});

test("fetch forward api error", async () => {
  mockFetch.mockImplementation(() =>
    Promise.resolve({ json: () => ({ error: "YATTA!" }) })
  );
  const client = new DilaApiClient();
  client.globalToken = "token";
  expect(
    client.fetch({
      params: {},
      path: "whatever",
    })
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"Error on API fetch: {\\"error\\":\\"YATTA!\\"}"`
  );
});

test("fetch a new token on 401", async () => {
  mockFetch.mockImplementation(() =>
    Promise.resolve({ json: () => ({ message: "ok", status: 200 }) })
  );
  const tokens = ["1234", "5678"];
  let tokenIndex = -1;

  ClientCredentials.prototype.getToken = jest.fn(() => {
    tokenIndex += 1;
    return Promise.resolve({
      token: { access_token: tokens[tokenIndex % 2] },
    } as any as AccessToken);
  });

  const client = new DilaApiClient();

  expect(ClientCredentials.prototype.getToken).toHaveBeenCalledTimes(0);
  expect(client.globalToken).toEqual(undefined);

  // first call (200)
  await client.fetch({
    params: {},
    path: "first call",
  });
  expect(ClientCredentials.prototype.getToken).toHaveBeenCalledTimes(1);
  expect(client.globalToken).toEqual("1234");

  // second call (200), kept the same token
  await client.fetch({
    params: {},
    path: "second call",
  });
  expect(ClientCredentials.prototype.getToken).toHaveBeenCalledTimes(1);
  expect(client.globalToken).toEqual("1234");

  mockFetch.mockImplementationOnce(() =>
    Promise.resolve({ error: "Unauthorized", status: 401 })
  );

  // first gets a 401, ask the token then get a 200
  await client.fetch({
    params: {},
    path: "third call",
  });
  expect(ClientCredentials.prototype.getToken).toHaveBeenCalledTimes(2);
  expect(client.globalToken).toEqual("5678");

  // this is a 200, kep the last token
  await client.fetch({
    params: {},
    path: "forth call",
  });
  expect(ClientCredentials.prototype.getToken).toHaveBeenCalledTimes(2);
  expect(client.globalToken).toEqual("5678");
});
