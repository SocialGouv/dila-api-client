const fetch = require("jest-fetch-mock");

jest.setMock("node-fetch", fetch);

jest.mock("simple-oauth2", () => ({
  create: () => ({
    clientCredentials: {
      getToken: () => {}
    },
    accessToken: {
      create: () => ({
        token: { access_token: 1234 }
      })
    }
  })
}));

fetch.mockResponse(JSON.stringify({ message: "YATTA!" }));

const Client = require("..");

describe("client.fetch", () => {
  test("make a call with correct token and parameters", async () => {
    const client = new Client();
    const res = await client.fetch({
      path: "consult/code/tableMatieres",
      method: "POST",
      params: {
        date: 1234,
        sctId: "",
        textId: "LEGITEXT000006072050"
      }
    });
    expect(fetch.mock.calls.length).toEqual(1);
    const firstCall = fetch.mock.calls[0];
    expect(firstCall[0]).toEqual(
      `${client.apiHost}/consult/code/tableMatieres`
    );
    expect(firstCall[1]).toMatchSnapshot();
  });
});
