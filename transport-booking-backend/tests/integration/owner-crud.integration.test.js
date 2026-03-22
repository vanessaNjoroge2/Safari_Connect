import test from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, requestJson, loginAs } from "../helpers/http.js";

test("owner fleet, routes, seats, and schedules CRUD works", async () => {
  const { server, baseUrl } = await startTestServer();

  try {
    const ownerToken = await loginAs(baseUrl, {
      email: "owner1@transport.com",
      password: "Password123!",
    });

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ownerToken}`,
    };

    const plateSuffix = String(Date.now()).slice(-5);

    const createBusRes = await requestJson(baseUrl, "/api/buses", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: `CRUD Coach ${plateSuffix}`,
        plateNumber: `KZZ ${plateSuffix}A`,
        seatCapacity: 16,
      }),
    });

    assert.equal(createBusRes.status, 201);
    assert.equal(createBusRes.body?.success, true);
    const busId = createBusRes.body?.data?.id;
    assert.ok(busId, "expected created bus id");

    const createSeatsRes = await requestJson(baseUrl, `/api/buses/${busId}/seats`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        seats: [
          { seatNumber: "A1", seatClass: "VIP", price: 3000 },
          { seatNumber: "A2", seatClass: "VIP", price: 3000 },
          { seatNumber: "B1", seatClass: "FIRST_CLASS", price: 2200 },
          { seatNumber: "B2", seatClass: "FIRST_CLASS", price: 2200 },
        ],
      }),
    });

    assert.equal(createSeatsRes.status, 201);
    assert.equal(createSeatsRes.body?.success, true);

    const updateSeatsRes = await requestJson(baseUrl, `/api/buses/${busId}/seats`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        seats: [
          { seatNumber: "A1", seatClass: "VIP", price: 3200 },
          { seatNumber: "A2", seatClass: "VIP", price: 3200 },
          { seatNumber: "B1", seatClass: "FIRST_CLASS", price: 2400 },
          { seatNumber: "B2", seatClass: "FIRST_CLASS", price: 2400 },
        ],
      }),
    });

    assert.equal(updateSeatsRes.status, 200);
    assert.equal(updateSeatsRes.body?.success, true);
    assert.equal(updateSeatsRes.body?.data?.length, 4);

    const updateBusRes = await requestJson(baseUrl, `/api/buses/${busId}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        name: `CRUD Coach Updated ${plateSuffix}`,
      }),
    });

    assert.equal(updateBusRes.status, 200);
    assert.equal(updateBusRes.body?.success, true);

    const createRouteRes = await requestJson(baseUrl, "/api/routes", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        origin: `CRUD Origin ${plateSuffix}`,
        destination: `CRUD Destination ${plateSuffix}`,
        distanceKm: 180,
        estimatedTime: 210,
      }),
    });

    assert.equal(createRouteRes.status, 201);
    assert.equal(createRouteRes.body?.success, true);
    const routeId = createRouteRes.body?.data?.id;
    assert.ok(routeId, "expected created route id");

    const updateRouteRes = await requestJson(baseUrl, `/api/routes/${routeId}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        estimatedTime: 200,
      }),
    });

    assert.equal(updateRouteRes.status, 200);
    assert.equal(updateRouteRes.body?.success, true);

    const departure = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const arrival = new Date(departure.getTime() + 3 * 60 * 60 * 1000);

    const createTripRes = await requestJson(baseUrl, "/api/trips", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        busId,
        routeId,
        tripType: "ONE_WAY",
        departureTime: departure.toISOString(),
        arrivalTime: arrival.toISOString(),
        basePrice: 1700,
      }),
    });

    assert.equal(createTripRes.status, 201);
    assert.equal(createTripRes.body?.success, true);
    const tripId = createTripRes.body?.data?.id;
    assert.ok(tripId, "expected created trip id");

    const updateTripRes = await requestJson(baseUrl, `/api/trips/${tripId}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({
        basePrice: 1900,
      }),
    });

    assert.equal(updateTripRes.status, 200);
    assert.equal(updateTripRes.body?.success, true);

    const cancelTripRes = await requestJson(baseUrl, `/api/trips/${tripId}/status`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ status: "CANCELLED" }),
    });

    assert.equal(cancelTripRes.status, 200);
    assert.equal(cancelTripRes.body?.success, true);

    const deleteTripRes = await requestJson(baseUrl, `/api/trips/${tripId}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    assert.equal(deleteTripRes.status, 200);
    assert.equal(deleteTripRes.body?.success, true);

    const clearSeatsRes = await requestJson(baseUrl, `/api/buses/${busId}/seats`, {
      method: "DELETE",
      headers: authHeaders,
    });

    assert.equal(clearSeatsRes.status, 200);
    assert.equal(clearSeatsRes.body?.success, true);

    const deleteBusRes = await requestJson(baseUrl, `/api/buses/${busId}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    assert.equal(deleteBusRes.status, 200);
    assert.equal(deleteBusRes.body?.success, true);

    const deleteRouteRes = await requestJson(baseUrl, `/api/routes/${routeId}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    assert.equal(deleteRouteRes.status, 200);
    assert.equal(deleteRouteRes.body?.success, true);
  } finally {
    await stopTestServer(server);
  }
});
