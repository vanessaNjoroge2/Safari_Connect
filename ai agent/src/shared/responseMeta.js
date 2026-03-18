const { randomUUID } = require("crypto");

function ensureRequestId(req, res) {
  const incoming = req.headers["x-request-id"];
  const requestId = typeof incoming === "string" && incoming.trim() ? incoming.trim() : randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
}

function buildMeta(req) {
  return {
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    version: "v1"
  };
}

module.exports = {
  ensureRequestId,
  buildMeta
};
