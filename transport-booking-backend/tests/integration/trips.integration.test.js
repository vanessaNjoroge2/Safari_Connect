import test from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, requestJson } from "../helpers/http.js";

function tomorrowDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

test("trip search returns data for bus and matatu categories", async () => {
  const { server, baseUrl } = await startTestServer();

  try {
    const date = tomorrowDate();

    const busRes = await requestJson(
      baseUrl,
      `/api/trips/search?category=bus&origin=Nairobi&destination=Nakuru&date=${date}&tripType=ONE_WAY`,
    );

    const matatuRes = await requestJson(
      baseUrl,
      `/api/trips/search?category=matatu&origin=Nairobi&destination=Nakuru&date=${date}&tripType=ONE_WAY`,
    );

    assert.equal(busRes.status, 200);
    assert.equal(matatuRes.status, 200);
    assert.ok(Array.isArray(busRes.body?.data));
    assert.ok(Array.isArray(matatuRes.body?.data));
    assert.ok(busRes.body.data.length > 0, "expected bus trips to be available");
    assert.ok(matatuRes.body.data.length > 0, "expected matatu trips to be available");
  } finally {
    await stopTestServer(server);
  }
});
