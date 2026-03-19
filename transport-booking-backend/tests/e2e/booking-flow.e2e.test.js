import test from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, requestJson, loginAs } from "../helpers/http.js";

function tomorrowDate() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

test("e2e booking flow: login -> search -> seats -> create booking -> fetch booking", async () => {
  const { server, baseUrl } = await startTestServer();

  try {
    const token = await loginAs(baseUrl, {
      email: "clifford@example.com",
      password: "Password123!",
    });

    const date = tomorrowDate();
    const searchRes = await requestJson(
      baseUrl,
      `/api/trips/search?category=bus&origin=Nairobi&destination=Nakuru&date=${date}&tripType=ONE_WAY`,
    );

    assert.equal(searchRes.status, 200);
    assert.ok(searchRes.body?.data?.length > 0, "expected at least one searchable trip");

    const trip = searchRes.body.data[0];

    const seatsRes = await requestJson(baseUrl, `/api/trips/${trip.id}/seats`);
    assert.equal(seatsRes.status, 200);

    const seat = seatsRes.body?.data?.seats?.find((s) => !s.isBooked);
    assert.ok(seat, "expected at least one available seat");

    const createRes = await requestJson(baseUrl, "/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tripId: trip.id,
        seatId: seat.id,
        firstName: "Clifford",
        lastName: "Mbithuka",
        email: "clifford@example.com",
        phone: "254711000001",
        nationalId: `39${Date.now().toString().slice(-6)}`,
        residence: "Nairobi",
      }),
    });

    assert.equal(createRes.status, 201);
    assert.equal(createRes.body?.success, true);
    assert.ok(createRes.body?.data?.id, "expected booking id");
    assert.ok(createRes.body?.data?.aiAnalysis, "expected ai analysis on created booking");

    const bookingId = createRes.body.data.id;

    const myBookingsRes = await requestJson(baseUrl, "/api/bookings/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(myBookingsRes.status, 200);
    assert.ok(
      myBookingsRes.body.data.some((b) => b.id === bookingId),
      "expected newly created booking to appear in my bookings",
    );

    const byIdRes = await requestJson(baseUrl, `/api/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(byIdRes.status, 200);
    assert.equal(byIdRes.body?.data?.id, bookingId);
    assert.ok(byIdRes.body?.data?.aiAnalysis);
  } finally {
    await stopTestServer(server);
  }
});
