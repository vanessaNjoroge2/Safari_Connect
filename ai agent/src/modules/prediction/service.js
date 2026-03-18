const { clamp, toFiniteNumber } = require("../../shared/sanitize");

function predictDelayRisk({ weatherRisk = 0.3, trafficRisk = 0.4, routeRisk = 0.3 }) {
  const safeWeather = clamp(toFiniteNumber(weatherRisk, 0.3), 0, 1);
  const safeTraffic = clamp(toFiniteNumber(trafficRisk, 0.4), 0, 1);
  const safeRoute = clamp(toFiniteNumber(routeRisk, 0.3), 0, 1);
  const score = safeWeather * 0.4 + safeTraffic * 0.4 + safeRoute * 0.2;

  let level = "low";
  if (score >= 0.65) {
    level = "high";
  } else if (score >= 0.4) {
    level = "medium";
  }
  const threshold = level === "high" ? 0.65 : level === "medium" ? 0.4 : 0;
  const confidence = clamp(0.5 + Math.abs(score - threshold), 0.5, 0.95);

  return {
    riskScore: Number(score.toFixed(4)),
    riskLevel: level,
    confidence: Number(confidence.toFixed(4)),
    recommendation:
      level === "high"
        ? "Recommend alternate departure time or route."
        : "Trip risk acceptable for current conditions.",
    signalsUsed: ["weatherRisk", "trafficRisk", "routeRisk"]
  };
}

module.exports = {
  predictDelayRisk
};
