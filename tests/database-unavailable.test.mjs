import assert from "node:assert/strict";
import test from "node:test";
import { onRequest } from "../functions/api/[[path]].js";

const failingDatabase = {
  prepare() {
    throw new Error("D1 internal connection details must stay private");
  },
};

test("un database temporaneamente indisponibile produce una risposta 503 controllata", async () => {
  const response = await onRequest({
    request: new Request("https://example.test/api/private"),
    env: { DB: failingDatabase },
    params: { path: ["private"] },
    waitUntil() {},
  });

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("retry-after"), "3");
  const body = await response.json();
  assert.equal(body.error, "Servizio temporaneamente non disponibile. Riprova.");
  assert.doesNotMatch(JSON.stringify(body), /D1|connection details/i);
});
