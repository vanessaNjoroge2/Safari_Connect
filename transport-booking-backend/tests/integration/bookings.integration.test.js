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

test("booking creation persists ticket snapshot in database", async () => {
  const { server, baseUrl } = await startTestServer();

  try {
    const token = await loginAs(baseUrl, {
      email: "clifford@example.com",
      password: "Password123!",
    });

    const user = await prisma.user.findUnique({ where: { email: "clifford@example.com" } });
    assert.ok(user, "expected demo user");

    const trip = await prisma.trip.findFirst({
      where: { status: "SCHEDULED" },
      include: {
        route: true,
        sacco: true,
        bus: { include: { seats: true } },
        bookings: {
          where: { status: { in: ["PENDING", "CONFIRMED"] } },
          select: { seatId: true },
        },
      },
      orderBy: { departureTime: "asc" },
    });

    assert.ok(trip, "expected scheduled trip");
    const bookedSeatIds = new Set(trip.bookings.map((b) => b.seatId));
    const freeSeat = trip.bus.seats.find((s) => !bookedSeatIds.has(s.id));
    assert.ok(freeSeat, "expected at least one free seat");

    const createRes = await requestJson(baseUrl, "/api/bookings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tripId: trip.id,
        seatId: freeSeat.id,
        firstName: "Snapshot",
        lastName: "Tester",
        email: "snapshot.tester@example.com",
        phone: "0712345678",
        nationalId: "12345670",
        residence: "Nairobi",
      }),
    });

    assert.equal(createRes.status, 201);
    const bookingId = createRes.body?.data?.id;
    assert.ok(bookingId, "expected booking id");

    const savedBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
    assert.ok(savedBooking, "expected saved booking");
    assert.ok(savedBooking.ticketSnapshot, "expected ticket snapshot to be persisted");

    const snapshot = savedBooking.ticketSnapshot;
    assert.equal(snapshot?.passenger?.firstName, "Snapshot");
    assert.equal(snapshot?.trip?.route?.origin, trip.route.origin);
    assert.equal(snapshot?.trip?.route?.destination, trip.route.destination);
    assert.equal(snapshot?.seat?.seatNumber, freeSeat.seatNumber);
    assert.equal(snapshot?.payment?.status, "PENDING");
  } finally {
    await stopTestServer(server);
  }
});

test.after(async () => {
  await prisma.$disconnect();
});
