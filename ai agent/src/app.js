const express = require("express");
const contract = require("./contracts/mvp-contract");
const { defaultLanguage, supportedLanguages, voiceProvider, hasGeminiKey } = require("./config/env");
const { normalizeLanguage } = require("./shared/language");
const { recommendTrips } = require("./modules/recommendation/service");
const { forecastPricing } = require("./modules/pricing/service");
const { predictDelayRisk } = require("./modules/prediction/service");
const { scoreFraud } = require("./modules/fraud/service");
const { respondToPrompt } = require("./modules/chat/service");
const { handleVoiceRequest } = require("./modules/voice/service");
const { planDispatch } = require("./modules/operations/service");
const { ensureRequestId, buildMeta } = require("./shared/responseMeta");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  ensureRequestId(req, res);
  next();
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "safari-connect-ai-agent",
    languageSupport: supportedLanguages,
    geminiConfigured: hasGeminiKey,
    uptimeSeconds: Number(process.uptime().toFixed(2))
  });
});

app.use((err, _req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "invalid_json", message: "Request body must be valid JSON" });
  }
  return next(err);
});

app.get("/v1/contract", (_req, res) => {
  res.json(contract);
});

app.post("/v1/recommendation/score", (req, res) => {
  res.json(recommendTrips(req.body || {}));
});

app.post("/v1/pricing/forecast", (req, res) => {
  res.json(forecastPricing(req.body || {}));
});

app.post("/v1/prediction/delay-risk", (req, res) => {
  res.json(predictDelayRisk(req.body || {}));
});

app.post("/v1/fraud/score", (req, res) => {
  res.json(scoreFraud(req.body || {}));
});

app.post("/v1/operations/dispatch-plan", (req, res) => {
  res.json(planDispatch(req.body || {}));
});

app.post("/v1/decision/assist", async (req, res) => {
  try {
    const body = req.body || {};
    const language = normalizeLanguage(body.language, defaultLanguage, supportedLanguages);

    const recommendation = recommendTrips({ trips: body.trips || [], intent: body.intent || {} });
    const pricing = forecastPricing({
      route: body.route,
      departureTime: body.departureTime,
      currentPrice: body.currentPrice
    });
    const delayRisk = predictDelayRisk(body.riskFactors || {});
    const fraud = scoreFraud(body.fraudSignals || {});
    const operations = planDispatch({
      route: body.route,
      departureTime: body.departureTime,
      totalSeats: body.totalSeats,
      bookedSeats: body.bookedSeats,
      noShowRate: body.noShowRate,
      weatherRisk: body.riskFactors && body.riskFactors.weatherRisk,
      trafficRisk: body.riskFactors && body.riskFactors.trafficRisk
    });
    const chat = await respondToPrompt({
      text: body.prompt,
      language,
      sessionId: body.sessionId
    });

    const summary = {
      topAction:
        fraud.decision === "block"
          ? "block_transaction"
          : operations.action === "add_vehicle"
            ? "add_standby_vehicle"
          : delayRisk.riskLevel === "high"
            ? "suggest_alternate_schedule"
            : recommendation.topPick
              ? "recommend_top_trip"
              : "collect_more_inputs",
      passengerMessage: chat.message
    };

    res.json({
      meta: buildMeta(req),
      language,
      modules: {
        recommendation,
        pricing,
        delayRisk,
        fraud,
        operations,
        chat
      },
      summary
    });
  } catch (error) {
    res.status(500).json({ error: "decision_assist_failed", message: error.message, meta: buildMeta(req) });
  }
});

app.post("/v1/chat/respond", async (req, res) => {
  try {
    const body = req.body || {};
    const language = normalizeLanguage(body.language, defaultLanguage, supportedLanguages);
    const result = await respondToPrompt({
      text: body.text,
      language,
      sessionId: body.sessionId
    });
    res.json({ ...result, meta: buildMeta(req) });
  } catch (error) {
    res.status(500).json({ error: "chat_response_failed", message: error.message, meta: buildMeta(req) });
  }
});

app.post("/v1/voice/respond", async (req, res) => {
  try {
    const body = req.body || {};
    const language = normalizeLanguage(body.language, defaultLanguage, supportedLanguages);
    const result = await handleVoiceRequest({
      language,
      transcript: body.transcript || "",
      provider: voiceProvider
    });
    res.json({ ...result, meta: buildMeta(req) });
  } catch (error) {
    res.status(500).json({ error: "voice_response_failed", message: error.message, meta: buildMeta(req) });
  }
});

module.exports = app;
