const { clamp, toFiniteNumber } = require("../../shared/sanitize");

function scoreTrip(trip, intent) {
  const maxBudget = Math.max(1, toFiniteNumber(intent.maxBudget, Number.MAX_SAFE_INTEGER));
  const preferredMinutes = Math.max(1, toFiniteNumber(intent.maxTravelMinutes, 24 * 60));
  const tripPrice = Math.max(0, toFiniteNumber(trip.price, maxBudget));
  const tripMinutes = Math.max(0, toFiniteNumber(trip.travelMinutes, preferredMinutes));
  const reliabilityScore = clamp(toFiniteNumber(trip.reliabilityScore, 0.7), 0, 1);

  const priceScore = Math.max(0, 1 - tripPrice / maxBudget);
  const timeScore = Math.max(0, 1 - tripMinutes / preferredMinutes);

  const weighted = priceScore * 0.4 + timeScore * 0.35 + reliabilityScore * 0.25;
  return Number(weighted.toFixed(4));
}

function recommendTrips({ trips = [], intent = {} }) {
  const ranked = trips
    .map((trip) => ({
      ...trip,
      score: scoreTrip(trip, intent)
    }))
    .sort((a, b) => b.score - a.score);

  const top = ranked[0] || null;
  const second = ranked[1] || null;
  const spread = top && second ? top.score - second.score : top ? top.score : 0;
  const confidence = top ? clamp(0.45 + spread * 1.2, 0.45, 0.96) : 0;

  return {
    topPick: top,
    confidence: Number(confidence.toFixed(4)),
    ranked,
    rationale: "Ranked by weighted price, duration, and route reliability.",
    signalsUsed: ["price", "travelMinutes", "reliabilityScore"]
  };
}

module.exports = {
  recommendTrips
};
