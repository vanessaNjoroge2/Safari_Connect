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

test.after(async () => {
  await prisma.$disconnect();
});
