const fetch = require("jest-fetch-mock");

jest.setMock("node-fetch", fetch);

fetch.mockResponse(JSON.stringify({ message: "YATTA!" }));

process.env = {
  OAUTH_CLIENT_ID: "test-client-id",
  OAUTH_CLIENT_SECRET: "test-client-secret"
};

const mockCreate = jest.fn(() => ({
  clientCredentials: {
    getToken: () => {}
  },
  accessToken: {
    create: () => ({
      token: { access_token: 1234 }
    })
  }
}));

jest.mock("simple-oauth2", () => ({
  create: mockCreate
}));

const Client = require("..");

describe("client.fetch", () => {
  test("send correct API parameters", async () => {
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

  test("send oauth credentials with process.env", async () => {
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

    expect(mockCreate.mock.calls.length).toEqual(4);
    expect(mockCreate.mock.calls[0][0]).toMatchSnapshot();
  });
});
