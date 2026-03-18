function toFiniteNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sanitizeText(value, maxLen = 500) {
  const text = String(value || "")
    .replace(/[\x00-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, maxLen);
}

function parseHour(dateLike) {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) {
    return null;
  }
  return d.getHours();
}

module.exports = {
  toFiniteNumber,
  clamp,
  sanitizeText,
  parseHour
};
