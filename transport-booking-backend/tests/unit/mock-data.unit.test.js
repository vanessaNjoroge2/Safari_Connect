import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_CODES = [
  "DEMO-BOOK-ALLOW-001",
  "DEMO-BOOK-REVIEW-002",
  "DEMO-BOOK-BLOCK-003",
];

test("mock data includes deterministic demo bookings", async () => {
  const rows = await prisma.booking.findMany({
    where: { bookingCode: { in: DEMO_CODES } },
    include: { payment: true, trip: true, user: true },
    orderBy: { bookingCode: "asc" },
  });

  assert.equal(rows.length, 3, "expected all deterministic demo booking codes");

  const byCode = Object.fromEntries(rows.map((r) => [r.bookingCode, r]));

  assert.equal(byCode["DEMO-BOOK-ALLOW-001"].status, "CONFIRMED");
  assert.equal(byCode["DEMO-BOOK-ALLOW-001"].payment?.status, "SUCCESS");

  assert.equal(byCode["DEMO-BOOK-REVIEW-002"].status, "PENDING");
  assert.equal(byCode["DEMO-BOOK-REVIEW-002"].payment?.status, "FAILED");

  assert.equal(byCode["DEMO-BOOK-BLOCK-003"].status, "CANCELLED");
  assert.equal(byCode["DEMO-BOOK-BLOCK-003"].payment?.status, "FAILED");
});

test("all seeded bookings/payments/trips have aiAnalysis", async () => {
  const [missingTrip, missingBooking, missingPayment] = await Promise.all([
    prisma.trip.count({ where: { aiAnalysis: null } }),
    prisma.booking.count({ where: { aiAnalysis: null } }),
    prisma.payment.count({ where: { aiAnalysis: null } }),
  ]);

  assert.equal(missingTrip, 0, "expected no trip records with null aiAnalysis");
  assert.equal(missingBooking, 0, "expected no booking records with null aiAnalysis");
  assert.equal(missingPayment, 0, "expected no payment records with null aiAnalysis");
});

test.after(async () => {
  await prisma.$disconnect();
});
