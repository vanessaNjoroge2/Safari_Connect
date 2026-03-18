const { clamp, parseHour, toFiniteNumber } = require("../../shared/sanitize");

function classifyDemand(hour) {
  if (hour === null) {
    return "unknown";
  }
  const isPeak = (hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 21);
  return isPeak ? "peak" : "off_peak";
}

function planDispatch(input = {}) {
  const totalSeats = Math.max(0, toFiniteNumber(input.totalSeats, 0));
  const bookedSeats = clamp(toFiniteNumber(input.bookedSeats, 0), 0, totalSeats || 0);
  const noShowRate = clamp(toFiniteNumber(input.noShowRate, 0.08), 0, 0.4);
  const weatherRisk = clamp(toFiniteNumber(input.weatherRisk, 0), 0, 1);
  const trafficRisk = clamp(toFiniteNumber(input.trafficRisk, 0), 0, 1);

  const occupancyRate = totalSeats > 0 ? bookedSeats / totalSeats : 0;
  const hour = parseHour(input.departureTime);
  const demandLevel = classifyDemand(hour);

  const combinedRisk = Number((weatherRisk * 0.45 + trafficRisk * 0.55).toFixed(2));
  const capacityPressure = Number((occupancyRate * 0.7 + (demandLevel === "peak" ? 0.2 : 0.08)).toFixed(2));
  const confidence = hour === null ? 0.61 : 0.79;

  const expectedNoShows = Math.round(bookedSeats * noShowRate);
  const overbookingBuffer = Math.max(0, Math.min(6, expectedNoShows));

  let action = "hold";
  let dispatchAdvice = "Maintain current schedule and keep monitoring confirmations.";

  if (capacityPressure >= 0.9 && demandLevel === "peak") {
    action = "add_vehicle";
    dispatchAdvice = "High seat pressure in a peak window. Add a standby vehicle or split load to avoid spillover.";
  } else if (capacityPressure >= 0.75) {
    action = "enable_waitlist";
    dispatchAdvice = "Activate waitlist and pre-confirm top demand passengers to protect fill rate.";
  } else if (combinedRisk >= 0.65) {
    action = "shift_departure";
    dispatchAdvice = "Operational risk is elevated. Shift departure by 15-30 minutes and notify passengers early.";
  }

  const riskLevel = combinedRisk >= 0.7 ? "high" : combinedRisk >= 0.4 ? "medium" : "low";

  return {
    route: input.route || null,
    demandLevel,
    occupancyRate: Number(occupancyRate.toFixed(2)),
    riskLevel,
    combinedRisk,
    overbookingBuffer,
    action,
    dispatchAdvice,
    confidence,
    signalsUsed: [
      "totalSeats",
      "bookedSeats",
      "noShowRate",
      "departureTime",
      "weatherRisk",
      "trafficRisk"
    ]
  };
}

module.exports = {
  planDispatch
};
