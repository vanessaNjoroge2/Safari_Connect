import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { startTestServer, stopTestServer, requestJson, loginAs } from "../helpers/http.js";

const prisma = new PrismaClient();

test("my bookings endpoint returns bookings with aiAnalysis", async () => {
  const { server, baseUrl } = await startTestServer();

  try {
    const token = await loginAs(baseUrl, {
      email: "clifford@example.com",
      password: "Password123!",
    });

    const res = await requestJson(baseUrl, "/api/bookings/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body?.data));
    assert.ok(res.body.data.length > 0, "expected seeded bookings for demo user");

    const first = res.body.data[0];
    assert.ok(typeof first.aiAnalysis === "string" && first.aiAnalysis.length > 0);
  } finally {
    await stopTestServer(server);
  }
});

test("demo booking payment status endpoint works", async () => {
  const { server, baseUrl } = await startTestServer();

  try {
    const token = await loginAs(baseUrl, {
      email: "clifford@example.com",
      password: "Password123!",
    });

    const demoBooking = await prisma.booking.findUnique({
      where: { bookingCode: "DEMO-BOOK-ALLOW-001" },
    });

    assert.ok(demoBooking, "expected deterministic demo booking to exist");

    const res = await requestJson(baseUrl, `/api/payments/status/${demoBooking.id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(res.status, 200);
    assert.equal(res.body?.data?.bookingCode, "DEMO-BOOK-ALLOW-001");
    assert.equal(res.body?.data?.payment?.status, "SUCCESS");
  } finally {
    await stopTestServer(server);
  }
});

test("stk push demo flow auto-confirms payment without callback verification", async () => {
  const { server, baseUrl } = await startTestServer();

  try {
    const token = await loginAs(baseUrl, {
      email: "clifford@example.com",
      password: "Password123!",
    });

    let pendingBooking = await prisma.booking.findFirst({
      where: {
        user: { email: "clifford@example.com" },
        status: "PENDING",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!pendingBooking) {
      const fallbackUser = await prisma.user.findUnique({ where: { email: "clifford@example.com" } });
      const fallbackTrip = await prisma.trip.findFirst({
        where: { status: "SCHEDULED" },
        include: { bus: { include: { seats: true } } },
        orderBy: { departureTime: "asc" },
      });

      assert.ok(fallbackUser, "expected fallback test user");
      assert.ok(fallbackTrip, "expected fallback scheduled trip");
      const fallbackSeat = fallbackTrip.bus.seats[0];
      assert.ok(fallbackSeat, "expected fallback seat");

      pendingBooking = await prisma.booking.create({
        data: {
          bookingCode: `DEMO-STK-${Date.now()}`,
          userId: fallbackUser.id,
          tripId: fallbackTrip.id,
          seatId: fallbackSeat.id,
          firstName: fallbackUser.firstName,
          lastName: fallbackUser.lastName,
          email: fallbackUser.email,
          phone: fallbackUser.phone || "0712345678",
          nationalId: "12345678",
          residence: "Nairobi",
          amount: fallbackSeat.price,
          status: "PENDING",
        },
      });
    }

    const stkRes = await requestJson(baseUrl, "/api/payments/stk-push", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId: pendingBooking.id,
        phoneNumber: "0712345678",
      }),
    });

    assert.equal(stkRes.status, 200);
    assert.equal(stkRes.body?.success, true);
    assert.equal(stkRes.body?.data?.payment?.status, "SUCCESS");
    assert.ok(stkRes.body?.data?.payment?.transactionRef);

    const statusRes = await requestJson(baseUrl, `/api/payments/status/${pendingBooking.id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.body?.data?.bookingStatus, "CONFIRMED");
    assert.equal(statusRes.body?.data?.payment?.status, "SUCCESS");
    assert.ok(String(statusRes.body?.data?.payment?.transactionRef || "").startsWith("DEMO"));
  } finally {
    await stopTestServer(server);
  }
});

test.after(async () => {
  await prisma.$disconnect();
});
