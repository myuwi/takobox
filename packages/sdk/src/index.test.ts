import axios, { AxiosError, type AxiosAdapter, type AxiosResponse } from "axios";
import { expect, test } from "vitest";
import { createTakoboxClient, type ErrorResponse } from "./index";

test("rejects when an endpoint returns an error response", async () => {
  const data: ErrorResponse = { message: "Invalid credentials" };
  const adapter: AxiosAdapter = async (config) => {
    const response: AxiosResponse<ErrorResponse> = {
      config,
      data,
      headers: {},
      status: 400,
      statusText: "Bad Request",
    };

    throw new AxiosError(
      "Request failed with status code 400",
      AxiosError.ERR_BAD_REQUEST,
      config,
      undefined,
      response,
    );
  };
  const client = createTakoboxClient({ axios: axios.create({ adapter }) });

  await expect(
    client.auth.login({ body: { username: "user", password: "invalid" } }),
  ).rejects.toMatchObject({
    response: { data, status: 400 },
  });
});
