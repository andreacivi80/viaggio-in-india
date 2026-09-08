import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");
const policy = await readFile(new URL("../docs/DATA-RETENTION-POLICY.md", import.meta.url), "utf8");
const maintenance = worker.slice(
  worker.indexOf("async function silentMaintenance"),
  worker.indexOf("async function chunkedMedia"),
);

test("la politica di conservazione coincide con la manutenzione automatica", () => {
  assert.match(policy, /Posizione condivisa \| 24 ore/);
  assert.match(policy, /Registro tecnico di sicurezza \| 180 giorni/);
  assert.match(policy, /Sessioni revocate \| Massimo 7 giorni/);
  assert.match(maintenance, /security_audit_log WHERE created_at<\?[\s\S]*?180 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(maintenance, /locations WHERE updated_at<\?[\s\S]*?24 \* 60 \* 60 \* 1000/);
  assert.match(maintenance, /revoked_at<\?[\s\S]*?7 \* 24 \* 60 \* 60 \* 1000/);
});

test("contenuti e documenti validi non vengono eliminati automaticamente", () => {
  assert.match(policy, /Documenti privati \| Per tutta la durata del profilo/);
  assert.match(policy, /Pubblicazioni e relativi media \| Finché la pubblicazione resta presente/);
  assert.match(policy, /Commenti e relativi media \| Finché il commento e la pubblicazione restano presenti/);
  assert.doesNotMatch(maintenance, /DELETE FROM document_status/i);
  assert.doesNotMatch(maintenance, /DELETE FROM posts/i);
  assert.doesNotMatch(maintenance, /DELETE FROM comments/i);
});

test("la conservazione push e degli originali elenca tutti gli eventi di rimozione", () => {
  assert.match(policy, /Sottoscrizioni push[\s\S]*?Disattivazione esplicita, logout, revoca del dispositivo\/profilo oppure risposta permanente 404\/410/);
  assert.match(policy, /formato caricato finché il contenuto che li usa rimane valido/);
  assert.match(worker, /\[404, 410\]\.includes\(error\?\.statusCode\)[\s\S]*?DELETE FROM push_subscriptions/);
  assert.match(worker, /path === "auth\/logout"[\s\S]*?DELETE FROM push_subscriptions WHERE profile_id=\?/);
  assert.match(worker, /path === "push\/subscribe"[\s\S]*?request\.method === "DELETE"/);
});
