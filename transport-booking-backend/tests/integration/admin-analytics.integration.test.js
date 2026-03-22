import test from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, requestJson, loginAs } from "../helpers/http.js";

test("admin analytics returns live KPI fields for supported ranges", async () => {
  const { server, baseUrl } = await startTestServer();

  try {
    const token = await loginAs(baseUrl, {
      email: "admin@transport.com",
      password: "Password123!",
    });

    for (const range of ["6m", "30d", "ytd"]) {
      const res = await requestJson(baseUrl, `/api/admins/analytics?range=${range}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      assert.equal(res.status, 200);
      assert.equal(res.body?.success, true);
      assert.equal(res.body?.data?.range, range);
      assert.equal(typeof res.body?.data?.periodLabel, "string");
      assert.equal(typeof res.body?.data?.kpis?.grossRevenue, "number");
      assert.equal(typeof res.body?.data?.kpis?.totalBookings, "number");
      assert.equal(typeof res.body?.data?.kpis?.activeSaccos, "number");
      assert.equal(typeof res.body?.data?.kpis?.refundRate, "number");
      assert.equal(typeof res.body?.data?.kpis?.repeatBookingRate, "number");
      assert.ok(Array.isArray(res.body?.data?.months));
      assert.ok(Array.isArray(res.body?.data?.topRoutes));
      assert.ok(Array.isArray(res.body?.data?.topSaccos));
    }
  } finally {
    await stopTestServer(server);
  }
});
