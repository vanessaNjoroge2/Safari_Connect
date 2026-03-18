module.exports = {
  version: "v1",
  endpoints: [
    {
      path: "/v1/recommendation/score",
      method: "POST",
      input: ["trips[]", "intent.maxBudget", "intent.maxTravelMinutes"],
      output: ["topPick", "confidence", "ranked[]", "rationale", "signalsUsed[]"]
    },
    {
      path: "/v1/pricing/forecast",
      method: "POST",
      input: ["route", "departureTime", "currentPrice"],
      output: ["predictedPrice", "confidence", "demandLevel", "cheaperWindowSuggestion", "signalsUsed[]"]
    },
    {
      path: "/v1/prediction/delay-risk",
      method: "POST",
      input: ["weatherRisk", "trafficRisk", "routeRisk"],
      output: ["riskScore", "riskLevel", "confidence", "recommendation", "signalsUsed[]"]
    },
    {
      path: "/v1/fraud/score",
      method: "POST",
      input: ["attemptsLast24h", "cardMismatch", "rapidRetries", "geoMismatch"],
      output: ["fraudScore", "decision", "confidence", "reason", "signalsUsed[]"]
    },
    {
      path: "/v1/operations/dispatch-plan",
      method: "POST",
      input: ["route", "departureTime", "totalSeats", "bookedSeats", "noShowRate", "weatherRisk", "trafficRisk"],
      output: ["demandLevel", "occupancyRate", "riskLevel", "combinedRisk", "overbookingBuffer", "action", "dispatchAdvice", "confidence", "signalsUsed[]"]
    },
    {
      path: "/v1/chat/respond",
      method: "POST",
      input: ["text", "language"],
      output: ["intent", "message", "source", "modelUsed", "disclaimer", "meta"]
    },
    {
      path: "/v1/voice/respond",
      method: "POST",
      input: ["transcript", "language"],
      output: ["replyText", "ttsVoice", "source", "modelUsed", "disclaimer", "inputMode", "outputMode", "note", "meta"]
    },
    {
      path: "/v1/decision/assist",
      method: "POST",
      input: ["trips[]", "intent", "route", "departureTime", "currentPrice", "totalSeats", "bookedSeats", "noShowRate", "riskFactors", "fraudSignals", "prompt", "language"],
      output: ["meta", "language", "modules.operations", "summary.topAction", "summary.passengerMessage"]
    }
  ],
  supportedLanguages: ["en", "sw"]
};
