const { toFiniteNumber } = require("../../shared/sanitize");

function scoreFraud({ attemptsLast24h = 0, cardMismatch = false, rapidRetries = 0, geoMismatch = false }) {
  const safeAttempts = Math.max(0, toFiniteNumber(attemptsLast24h, 0));
  const safeRetries = Math.max(0, toFiniteNumber(rapidRetries, 0));

  let score = 0.1;
  score += Math.min(safeAttempts * 0.08, 0.4);
  score += cardMismatch ? 0.25 : 0;
  score += Math.min(safeRetries * 0.07, 0.2);
  score += geoMismatch ? 0.2 : 0;

  const normalized = Math.min(1, Number(score.toFixed(4)));
  const decision = normalized >= 0.7 ? "block" : normalized >= 0.45 ? "review" : "allow";
  const boundaryDistance = decision === "block" ? normalized - 0.7 : decision === "review" ? Math.min(normalized - 0.45, 0.7 - normalized) : 0.45 - normalized;
  const confidence = Math.min(0.96, Math.max(0.52, 0.52 + Math.abs(boundaryDistance)));

  return {
    fraudScore: normalized,
    decision,
    confidence: Number(confidence.toFixed(4)),
    reason: "Rule-based baseline score; replace with model score when training data is ready.",
    signalsUsed: ["attemptsLast24h", "cardMismatch", "rapidRetries", "geoMismatch"]
  };
}

module.exports = {
  scoreFraud
};
