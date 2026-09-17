import assert from "node:assert/strict";
import test from "node:test";

import {
  clearOfflineCopies,
  inspectOfflineReadiness,
  networkDescription,
} from "../src/offlineCenter.js";

test("il centro descrive rete debole, risparmio dati e offline", () => {
  assert.equal(networkDescription({ effectiveType: "3g" }, true), "3G");
  assert.equal(networkDescription({ type: "wifi", saveData: true }, true), "Wi-Fi · risparmio dati");
  assert.equal(networkDescription(null, false), "Offline");
});

test("la prontezza considera soltanto la cache dell'app", async () => {
  const result = await inspectOfflineReadiness({ keys: async () => ["estranea", "thailandia-insieme-v1"] });
  assert.deepEqual(result, { ready: true, cacheCount: 1 });
});

test("cancellare le copie offline non tocca sessioni né coda invii", async () => {
  const deleted = [];
  const removed = [];
  const result = await clearOfflineCopies({
    cacheStorage: {
      keys: async () => ["thailandia-insieme-v1", "cache-estranea"],
      delete: async (key) => { deleted.push(key); return true; },
    },
    storage: { removeItem: (key) => removed.push(key) },
  });
  assert.deepEqual(result, { deletedCaches: 1 });
  assert.deepEqual(deleted, ["thailandia-insieme-v1"]);
  assert.deepEqual(removed, ["india-posts", "india-people"]);
  assert.ok(!removed.includes("india-session-token"));
  assert.ok(!removed.includes("india-device-key"));
  assert.ok(!removed.some((key) => /queue/i.test(key)));
});
