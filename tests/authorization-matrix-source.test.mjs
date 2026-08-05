import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workerPath = new URL("../functions/api/[[path]].js", import.meta.url);

test("la password comune non può inviare notifiche operative", async () => {
  const worker = await readFile(workerPath, "utf8");
  const block = worker.slice(worker.indexOf('path === "push/test"'), worker.indexOf('path === "uploads/init"'));
  assert.match(block, /sessionFromRequest/);
  assert.match(block, /session\.role !== "coordinator"/);
  assert.doesNotMatch(block, /groupOk\(request, env\)/);
  assert.match(block, /rateLimit\(env, request, "push-test"/);
});

test("i metadati del consenso non sono inclusi nello stato dei profili", async () => {
  const worker = await readFile(workerPath, "utf8");
  assert.match(worker, /privacy_consent_at: _privacyConsentAt/);
  assert.match(worker, /privacy_consent_version: _privacyConsentVersion/);
});
