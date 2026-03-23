const { clamp, toFiniteNumber } = require("../../shared/sanitize");

function normalizeRoute(route) {
  return String(route || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/->|→/g, "-");
}

function normalizeName(name) {
  return String(name || "").toLowerCase().trim();
}

function extractHour(value) {
  if (!value) return null;
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d.getHours();

  const match = String(value).match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (!match) return null;
  return Number(match[1]);
}

function behaviorScore(trip, intent) {
  const behavior = intent.behavior || {};
  const preferredRoutes = Array.isArray(behavior.preferredRoutes)
    ? behavior.preferredRoutes.map(normalizeRoute)
    : [];
  const preferredSaccos = Array.isArray(behavior.preferredSaccos)
    ? behavior.preferredSaccos.map(normalizeName)
    : [];

  const preferredBudget = Math.max(0, toFiniteNumber(behavior.preferredBudgetKes, 0));
  const preferredDepartureHour = toFiniteNumber(behavior.preferredDepartureHour, NaN);

  const signals = [];

  if (preferredRoutes.length) {
    const routeHit = preferredRoutes.includes(normalizeRoute(trip.route));
    signals.push(routeHit ? 1 : 0.2);
  }

  if (preferredSaccos.length) {
    const saccoHit = preferredSaccos.includes(normalizeName(trip.saccoName));
    signals.push(saccoHit ? 1 : 0.25);
  }

  if (preferredBudget > 0) {
    const price = Math.max(0, toFiniteNumber(trip.price, preferredBudget));
    const budgetDelta = Math.abs(price - preferredBudget) / Math.max(preferredBudget, 1);
    signals.push(clamp(1 - budgetDelta, 0, 1));
  }

  if (Number.isFinite(preferredDepartureHour)) {
    const tripHour = extractHour(trip.departureTime);
    if (Number.isFinite(tripHour)) {
      const diff = Math.abs(tripHour - preferredDepartureHour);
      if (diff <= 1) signals.push(1);
      else if (diff <= 3) signals.push(0.7);
      else signals.push(0.35);
    }
  }

  if (!signals.length) return 0.5;

  const avg = signals.reduce((sum, n) => sum + n, 0) / signals.length;
  return Number(clamp(avg, 0, 1).toFixed(4));
}

function scoreTrip(trip, intent) {
  const maxBudget = Math.max(1, toFiniteNumber(intent.maxBudget, Number.MAX_SAFE_INTEGER));
  const preferredMinutes = Math.max(1, toFiniteNumber(intent.maxTravelMinutes, 24 * 60));
  const tripPrice = Math.max(0, toFiniteNumber(trip.price, maxBudget));
  const tripMinutes = Math.max(0, toFiniteNumber(trip.travelMinutes, preferredMinutes));
  const reliabilityScore = clamp(toFiniteNumber(trip.reliabilityScore, 0.7), 0, 1);
  const personalization = behaviorScore(trip, intent);

  const priceScore = Math.max(0, 1 - tripPrice / maxBudget);
  const timeScore = Math.max(0, 1 - tripMinutes / preferredMinutes);

  const weighted =
    priceScore * 0.32 +
    timeScore * 0.28 +
    reliabilityScore * 0.2 +
    personalization * 0.2;
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
    rationale: "Ranked by weighted price, duration, reliability, and rider behavior affinity.",
    signalsUsed: ["price", "travelMinutes", "reliabilityScore", "preferredRoutes", "preferredSaccos", "preferredBudgetKes", "preferredDepartureHour"]
  };
}

module.exports = {
  recommendTrips
};
