import { env } from "../../config/env.js";

function normalizeBaseUrl(url) {
  return String(url || "http://localhost:4100").replace(/\/+$/, "");
}

function buildUpstreamError(status, fallbackMessage) {
  const error = new Error(fallbackMessage);
  error.statusCode = status;
  return error;
}

async function callAi(path, payload, method = "POST") {
  const baseUrl = normalizeBaseUrl(env.AI_AGENT_BASE_URL);
  const timeoutMs = Number(env.AI_AGENT_TIMEOUT_MS || 8000);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: method === "GET" ? undefined : JSON.stringify(payload || {}),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data?.message || data?.error || `AI agent request failed (${response.status})`;
      throw buildUpstreamError(502, message);
    }

    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw buildUpstreamError(504, "AI agent timeout");
    }

    if (error.statusCode) {
      throw error;
    }

    throw buildUpstreamError(502, "Could not reach AI agent service");
  } finally {
    clearTimeout(timer);
  }
}

function fallbackHealth() {
  return {
    status: "degraded",
    service: "safari-connect-ai-agent-proxy",
    reason: "upstream_unavailable",
    languageSupport: ["en", "sw"],
    geminiConfigured: false,
    fallback: true,
  };
}

function fallbackChat(payload = {}) {
  const text = String(payload?.text || "").toLowerCase();
  const isSw = String(payload?.language || "en").toLowerCase().startsWith("sw");

  const sw = {
    base: "Niko tayari kusaidia. Nipatie route, tarehe/saa na bajeti ili nikupatie chaguo bora.",
    pricing: "Ninaweza kukupa muda wa nauli nafuu. Nipatie route na muda wa kuondoka.",
    delay: "Naweza kukadiria hatari ya ucheleweshaji kwa kutumia traffic, weather na route risk.",
    fraud: "Muamala huu una alama zisizo za kawaida. Ushauri: weka kwenye review kabla ya kuthibitisha.",
  };

  const en = {
    base: "I can help. Share route, date/time, and budget so I can suggest the best option.",
    pricing: "I can suggest a cheaper fare window. Share route and departure time.",
    delay: "I can estimate delay risk from route, weather, and traffic inputs.",
    fraud: "This transaction shows unusual signals. Recommendation: place it in review before confirmation.",
  };

  const hints = isSw ? sw : en;
  let message = hints.base;
  if (text.includes("price") || text.includes("fare") || text.includes("bei")) message = hints.pricing;
  if (text.includes("delay") || text.includes("traffic") || text.includes("uchelew")) message = hints.delay;
  if (text.includes("fraud") || text.includes("anomaly") || text.includes("suspicious")) message = hints.fraud;

  return {
    intent: "decision_guidance",
    message,
    source: "fallback",
    modelUsed: null,
    disclaimer: "Generated from deterministic fallback because upstream AI was unavailable.",
  };
}

function fallbackVoice(payload = {}) {
  const isSw = String(payload?.language || "en").toLowerCase().startsWith("sw");
  return {
    language: isSw ? "sw" : "en",
    provider: "browser",
    transcript: String(payload?.transcript || ""),
    replyText: isSw
      ? "Niko tayari kusaidia. Nipatie route, tarehe na bajeti ili nikupatie uamuzi bora."
      : "I am ready to help. Share route, date, and budget for a better decision.",
    source: "fallback",
    modelUsed: null,
    disclaimer: "Voice response generated from deterministic fallback because upstream AI was unavailable.",
    inputMode: "voice",
    outputMode: "text-and-tts",
    ttsVoice: isSw ? "sw-KE-Standard-A" : "en-KE-Neural2-A",
    ttsProvider: "browser",
    audioBase64: null,
    audioMimeType: null,
    note: "Premium TTS unavailable. Frontend may use browser speech synthesis.",
  };
}

function fallbackAssist(payload = {}) {
  const currentPrice = Number(payload?.currentPrice || 1500);
  const bookedSeats = Number(payload?.bookedSeats || 0);
  const totalSeats = Number(payload?.totalSeats || 50);
  const occupancyRate = totalSeats > 0 ? Math.min(1, Math.max(0, bookedSeats / totalSeats)) : 0;
  const predictedPrice = Number((currentPrice * (occupancyRate > 0.75 ? 1.15 : 0.95)).toFixed(2));
  const fraudScore = 0.52;
  const fraudDecision = fraudScore >= 0.7 ? "block" : fraudScore >= 0.45 ? "review" : "allow";
  const delayRisk = Math.min(0.92, Math.max(0.15, Number(payload?.riskFactors?.trafficRisk || 0.4) * 0.6 + Number(payload?.riskFactors?.weatherRisk || 0.3) * 0.4));
  const riskLevel = delayRisk >= 0.65 ? "high" : delayRisk >= 0.4 ? "medium" : "low";
  const action = occupancyRate >= 0.9 ? "add_vehicle" : occupancyRate >= 0.75 ? "enable_waitlist" : riskLevel === "high" ? "shift_departure" : "hold";

  return {
    language: String(payload?.language || "en").toLowerCase().startsWith("sw") ? "sw" : "en",
    modules: {
      recommendation: {
        topPick: payload?.trips?.[0] || null,
        confidence: 0.63,
        ranked: Array.isArray(payload?.trips) ? payload.trips : [],
        rationale: "Fallback ranking based on provided trip order.",
        signalsUsed: ["price", "travelMinutes", "reliabilityScore"],
      },
      pricing: {
        route: payload?.route || null,
        currentPrice,
        predictedPrice,
        confidence: 0.61,
        demandLevel: occupancyRate > 0.75 ? "high" : "normal",
        cheaperWindowSuggestion: occupancyRate > 0.75 ? "10:00-16:00" : "Current slot is cost-efficient",
        signalsUsed: ["currentPrice", "bookedSeats", "totalSeats"],
      },
      delayRisk: {
        riskScore: Number(delayRisk.toFixed(4)),
        riskLevel,
        confidence: 0.64,
        recommendation:
          riskLevel === "high"
            ? "Adjust departure by 15-30 minutes and notify passengers."
            : "Risk acceptable; continue monitoring traffic and weather updates.",
        signalsUsed: ["weatherRisk", "trafficRisk", "routeRisk"],
      },
      fraud: {
        fraudScore,
        decision: fraudDecision,
        confidence: 0.6,
        reason: "Fallback risk signal due to upstream AI unavailability.",
        signalsUsed: ["attemptsLast24h", "cardMismatch", "rapidRetries", "geoMismatch"],
      },
      operations: {
        route: payload?.route || null,
        occupancyRate: Number(occupancyRate.toFixed(2)),
        riskLevel,
        combinedRisk: Number(delayRisk.toFixed(2)),
        overbookingBuffer: Math.max(0, Math.min(6, Math.round(bookedSeats * Number(payload?.noShowRate || 0.08)))),
        action,
        dispatchAdvice:
          action === "add_vehicle"
            ? "High demand detected. Add standby vehicle to avoid spillover."
            : action === "enable_waitlist"
              ? "Enable waitlist and pre-confirm demand-heavy passengers."
              : action === "shift_departure"
                ? "Operational risk elevated. Shift departure and notify passengers."
                : "Maintain schedule and keep monitoring demand.",
        confidence: 0.62,
        signalsUsed: ["totalSeats", "bookedSeats", "noShowRate", "weatherRisk", "trafficRisk"],
      },
      chat: fallbackChat({ text: payload?.prompt || "", language: payload?.language || "en" }),
    },
    summary: {
      topAction: action,
      passengerMessage: "We are running in resilient fallback mode. Share route, time, and budget for a stronger recommendation.",
    },
    fallback: true,
  };
}

export const getAiHealth = async () => {
  try {
    return await callAi("/health", null, "GET");
  } catch {
    return fallbackHealth();
  }
};

export const getAiAssist = async (payload) => {
  try {
    return await callAi("/v1/decision/assist", payload);
  } catch {
    return fallbackAssist(payload);
  }
};

export const getAiChat = async (payload) => {
  try {
    return await callAi("/v1/chat/respond", payload);
  } catch {
    return fallbackChat(payload);
  }
};

export const getAiVoice = async (payload) => {
  try {
    return await callAi("/v1/voice/respond", payload);
  } catch {
    return fallbackVoice(payload);
  }
};
