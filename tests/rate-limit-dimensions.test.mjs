import assert from "node:assert/strict";
import test from "node:test";
import { rateLimitDimensions, rateLimitForDimension } from "../functions/api/[[path]].js";

test("i limiti autenticati distinguono IP profilo e singola sessione", () => {
  const request = new Request("https://qa.example/api/comments", {
    headers: {
      authorization: "Bearer sessione-di-prova",
      "cf-connecting-ip": "203.0.113.10",
    },
  });
  assert.deepEqual(rateLimitDimensions(request, "profilo-uno"), [
    "ip:203.0.113.10",
    "actor:profilo-uno",
    "session:sessione-di-prova",
  ]);
});

test("i limiti ospite distinguono IP identità e sessione familiare", () => {
  const request = new Request("https://qa.example/api/reactions", {
    headers: {
      "x-guest-token": "ospite-di-prova",
      "cf-connecting-ip": "198.51.100.20",
    },
  });
  assert.deepEqual(rateLimitDimensions(request, "familiare-uno"), [
    "ip:198.51.100.20",
    "actor:familiare-uno",
    "guest-session:ospite-di-prova",
  ]);
});

test("diciotto viaggiatori sulla stessa Wi-Fi non esauriscono il limite notifiche", () => {
  assert.equal(rateLimitForDimension("ip:203.0.113.10", 8, { ip: 72 }), 72);
  assert.equal(rateLimitForDimension("actor:profilo-uno", 8, { ip: 72 }), 8);
  assert.equal(rateLimitForDimension("session:token", 8, { ip: 72 }), 8);
});
