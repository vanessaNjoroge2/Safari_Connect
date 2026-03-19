import test from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, requestJson } from "../helpers/http.js";

test("auth login returns token for demo admin", async () => {
  const { server, baseUrl } = await startTestServer();

  try {
    const res = await requestJson(baseUrl, "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@transport.com",
        password: "Password123!",
      }),
    });

    assert.equal(res.status, 200);
    assert.equal(res.body?.success, true);
    assert.ok(res.body?.data?.token, "expected jwt token in login response");
    assert.equal(res.body?.data?.user?.role, "ADMIN");
  } finally {
    await stopTestServer(server);
  }
});
