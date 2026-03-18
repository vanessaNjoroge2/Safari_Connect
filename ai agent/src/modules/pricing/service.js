const { parseHour, toFiniteNumber } = require("../../shared/sanitize");

function forecastPricing({ route, departureTime, currentPrice }) {
  const hour = parseHour(departureTime);
  const peak = hour !== null && ((hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 21));
  const basePrice = Math.max(0, toFiniteNumber(currentPrice, 0));

  const expectedMultiplier = peak ? 1.2 : 0.9;
  const predictedPrice = Number((basePrice * expectedMultiplier).toFixed(2));
  const confidence = hour === null ? 0.35 : 0.74;

  return {
    route,
    currentPrice: basePrice,
    predictedPrice,
    confidence,
    demandLevel: hour === null ? "unknown" : peak ? "high" : "normal",
    cheaperWindowSuggestion:
      hour === null
        ? "Share a valid departure time to get a stronger pricing forecast"
        : peak
          ? "10:00-16:00"
              : "Current slot is already cost-efficient",
            signalsUsed: ["departureTime", "currentPrice"]
  };
}

module.exports = {
  forecastPricing
};
