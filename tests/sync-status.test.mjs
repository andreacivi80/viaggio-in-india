import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { syncStatusLabel } from "../src/syncStatus.js";

test("l'indicatore distingue attesa, offline e ultima sincronizzazione", () => {
  assert.equal(syncStatusLabel(0, true), "Sync in attesa");
  assert.equal(syncStatusLabel(0, false), "Offline · mai sincronizzato");
  assert.match(syncStatusLabel(Date.UTC(2026, 8, 17, 9, 45), true), /^Sync \d{2}:\d{2}$/);
  assert.match(syncStatusLabel(Date.UTC(2026, 8, 17, 9, 45), false), /^Offline · sync \d{2}:\d{2}$/);
});

test("l'ora viene registrata soltanto dopo uno stato server valido", async () => {
  const client = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
  const successBlock = client.slice(client.indexOf("const d = await r.json();"), client.indexOf("if (sessionTokenRef.current)"));
  assert.match(successBlock, /setLastSyncedAt\(syncedAt\)/);
  assert.match(successBlock, /localStorage\.setItem\("thailand-last-sync-at"/);
  assert.match(client, /aria-label=\{`Ultima sincronizzazione:/);
  assert.match(client, /addEventListener\("offline", offline\)/);
});
