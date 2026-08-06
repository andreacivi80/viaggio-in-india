import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const ownerToken = process.env.QA_SESSION_TOKEN;
const otherToken = process.env.QA_SECOND_SESSION_TOKEN;
const coordinatorToken = process.env.QA_COORDINATOR_TOKEN;
const coordinatorSecondToken = process.env.QA_COORDINATOR_SECOND_TOKEN;
if (!base || !ownerToken || !otherToken || !coordinatorToken || !coordinatorSecondToken)
  throw new Error("Ambiente QA limiti multidimensionali incompleto");

const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
const invalidComment = (token, ip) => {
  const form = new FormData();
  form.set("post_id", `inesistente-${crypto.randomUUID()}`);
  form.set("text", "prova limite");
  return request("/api/comments", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "cf-connecting-ip": ip },
    body: form,
  });
};

const actorStatuses = [];
for (let index = 0; index < 11; index += 1) {
  const firstSession = index % 2 === 0;
  const response = await invalidComment(
    firstSession ? coordinatorToken : coordinatorSecondToken,
    firstSession ? "203.0.113.11" : "203.0.113.12",
  );
  actorStatuses.push(response.status);
}
assert.deepEqual(actorStatuses.slice(0, 10), Array(10).fill(404));
assert.equal(actorStatuses[10], 429, "due sessioni dello stesso profilo non devono aggirare il limite attore");

const invalidReaction = (token) => request("/api/reactions", {
  method: "POST",
  headers: {
    authorization: `Bearer ${token}`,
    "cf-connecting-ip": "198.51.100.44",
    "content-type": "application/json",
  },
  body: JSON.stringify({ post_id: `inesistente-${crypto.randomUUID()}`, kind: "heart" }),
});
const ipStatuses = [];
for (let index = 0; index < 31; index += 1) {
  const response = await invalidReaction(index % 2 === 0 ? ownerToken : otherToken);
  ipStatuses.push(response.status);
}
assert.deepEqual(ipStatuses.slice(0, 30), Array(30).fill(404));
assert.equal(ipStatuses[30], 429, "profili diversi sullo stesso IP non devono aggirare il limite rete");

console.log("P0_RATE_LIMIT_DIMENSIONS=6/6");
