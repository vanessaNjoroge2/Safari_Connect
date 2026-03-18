const test = require("node:test");
const assert = require("node:assert/strict");

const { recommendTrips } = require("../../src/modules/recommendation/service");
const { scoreFraud } = require("../../src/modules/fraud/service");
const { respondToPrompt } = require("../../src/modules/chat/service");
const { handleVoiceRequest } = require("../../src/modules/voice/service");
const { forecastPricing } = require("../../src/modules/pricing/service");
const { planDispatch } = require("../../src/modules/operations/service");

test("recommendation returns top pick", () => {
  const result = recommendTrips({
    trips: [
      { id: "A", price: 1400, travelMinutes: 420, reliabilityScore: 0.8 },
      { id: "B", price: 1100, travelMinutes: 460, reliabilityScore: 0.7 }
    ],
    intent: { maxBudget: 1500, maxTravelMinutes: 500 }
  });

  assert.ok(result.topPick);
  assert.equal(result.ranked.length, 2);
  assert.ok(result.confidence >= 0);
  assert.ok(result.signalsUsed.includes("price"));
});

test("fraud scoring returns decision", () => {
  const result = scoreFraud({ attemptsLast24h: 5, cardMismatch: true, rapidRetries: 3, geoMismatch: false });

  assert.ok(["allow", "review", "block"].includes(result.decision));
  assert.ok(result.fraudScore >= 0);
  assert.ok(result.fraudScore <= 1);
  assert.ok(result.confidence >= 0.5);
  assert.ok(Array.isArray(result.signalsUsed));
});

test("chat returns structured response", async () => {
  const result = await respondToPrompt({ text: "I need a cheap bus to Kisii", language: "en" });

  assert.ok(result.intent);
  assert.ok(result.message);
  assert.ok(["gemini", "fallback"].includes(result.source));
  assert.ok(result.disclaimer);
});

test("voice returns bilingual TTS metadata", async () => {
  const result = await handleVoiceRequest({
    language: "sw",
    transcript: "Nataka kwenda Kisii kesho asubuhi",
    provider: "gemini"
  });

  assert.equal(result.language, "sw");
  assert.ok(result.replyText);
  assert.ok(result.ttsVoice);
});

test("pricing handles invalid departure time safely", () => {
  const result = forecastPricing({ route: "Nairobi-Kisii", departureTime: "not-a-date", currentPrice: "1500" });

  assert.equal(result.demandLevel, "unknown");
  assert.equal(result.currentPrice, 1500);
  assert.ok(result.predictedPrice >= 0);
  assert.ok(result.confidence > 0);
});

test("voice transcript is sanitized", async () => {
  const result = await handleVoiceRequest({
    language: "en",
    transcript: "  test\n\u0000message  ",
    provider: "gemini"
  });

  assert.equal(result.transcript.includes("\n"), false);
  assert.equal(result.transcript.includes("\u0000"), false);
});

test("operations dispatch planner returns actionable decision", () => {
  const result = planDispatch({
    route: "Nairobi-Nakuru",
    departureTime: "2026-03-20T07:30:00.000Z",
    totalSeats: 50,
    bookedSeats: 47,
    noShowRate: 0.08,
    weatherRisk: 0.2,
    trafficRisk: 0.6
  });

  assert.ok(["add_vehicle", "enable_waitlist", "shift_departure", "hold"].includes(result.action));
  assert.ok(result.occupancyRate >= 0);
  assert.ok(result.occupancyRate <= 1);
  assert.ok(result.overbookingBuffer >= 0);
  assert.ok(result.dispatchAdvice);
  assert.ok(result.signalsUsed.includes("bookedSeats"));
});
