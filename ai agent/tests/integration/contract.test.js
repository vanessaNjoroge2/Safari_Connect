const test = require("node:test");
const assert = require("node:assert/strict");

const contract = require("../../src/contracts/mvp-contract");

test("contract exposes bilingual support", () => {
  assert.ok(contract.supportedLanguages.includes("en"));
  assert.ok(contract.supportedLanguages.includes("sw"));
});

test("contract includes voice endpoint", () => {
  const endpoint = contract.endpoints.find((item) => item.path === "/v1/voice/respond");
  assert.ok(endpoint);
  assert.equal(endpoint.method, "POST");
  assert.ok(endpoint.output.includes("replyText"));
  assert.ok(endpoint.output.includes("modelUsed"));
});

test("contract includes chat model metadata", () => {
  const endpoint = contract.endpoints.find((item) => item.path === "/v1/chat/respond");
  assert.ok(endpoint);
  assert.ok(endpoint.output.includes("source"));
  assert.ok(endpoint.output.includes("modelUsed"));
});

test("contract includes professional decision assist endpoint", () => {
  const endpoint = contract.endpoints.find((item) => item.path === "/v1/decision/assist");
  assert.ok(endpoint);
  assert.equal(endpoint.method, "POST");
  assert.ok(endpoint.output.includes("summary.topAction"));
});
