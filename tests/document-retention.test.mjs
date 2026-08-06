import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");

test("la manutenzione automatica non elimina documenti privati validi", () => {
  const maintenance = worker.slice(
    worker.indexOf("async function silentMaintenance"),
    worker.indexOf("async function chunkedMedia"),
  );
  const health = worker.slice(
    worker.indexOf('path === "health"'),
    worker.indexOf('path === "weather"'),
  );
  assert.doesNotMatch(maintenance, /DELETE FROM document_status/i);
  assert.doesNotMatch(health, /DELETE FROM document_status/i);
  assert.match(maintenance, /DELETE FROM locations WHERE updated_at<\?/i);
});

test("la rimozione documenti resta legata ad azioni esplicite e autorizzate", () => {
  assert.match(worker, /DELETE FROM document_status WHERE profile_id=\? AND doc_type=\?/);
  assert.match(worker, /DELETE FROM document_status WHERE profile_id=\?/);
  assert.match(worker, /path\.startsWith\("documents\/"\)[\s\S]*?session\.profile_id !== profileId[\s\S]*?Documento non autorizzato/);
});
