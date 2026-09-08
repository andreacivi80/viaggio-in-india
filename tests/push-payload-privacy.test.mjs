import test from "node:test";
import assert from "node:assert/strict";

import { sanitizePushPayload } from "../functions/api/[[path]].js";

const sensitivePayload = {
  title: "Mario Rossi",
  body: "Passaporto YA1234567, visto e documento allegato",
  url: "/?post=post-1&comment=comment-2",
  tag: "comment-comment-2",
  visibility: "group",
  author_profile_id: "profilo-riservato",
  document_content: "contenuto passaporto",
  file_name: "passaporto-mario.pdf",
};

test("la notifica conserva soltanto campi pubblici strettamente necessari", () => {
  const result = sanitizePushPayload(sensitivePayload);

  assert.deepEqual(Object.keys(result).sort(), ["body", "tag", "title", "url"]);
  assert.equal(result.title, "Thailandia Insieme");
  assert.equal(result.body, "È stato aggiunto un nuovo commento.");
  assert.equal(result.url, "/?post=post-1&comment=comment-2");
  assert.equal(result.tag, "comment-comment-2");
});

test("testo, numero di passaporto, nome file e identificativi non entrano nel push", () => {
  const serialized = JSON.stringify(sanitizePushPayload(sensitivePayload));

  for (const forbidden of [
    "YA1234567",
    "Passaporto",
    "Mario Rossi",
    "profilo-riservato",
    "passaporto-mario.pdf",
    "contenuto passaporto",
  ]) assert.equal(serialized.includes(forbidden), false, forbidden);
});

test("un URL esterno o inatteso viene sostituito con la home", () => {
  assert.equal(sanitizePushPayload({ url: "https://evil.example/document" }).url, "/");
  assert.equal(sanitizePushPayload({ url: "/documents/private/passport" }).url, "/");
});

test("emoji, caratteri speciali e testi molto lunghi producono sempre una notifica generica limitata", () => {
  const result = sanitizePushPayload({
    title: `🎉 <script>${"T".repeat(2_000)}`,
    body: `àèìòù & < > ${"B".repeat(10_000)}`,
    tag: `post-🎉-${"x".repeat(300)}`,
    url: "/?post=post-1",
  });
  assert.equal(result.title, "Thailandia Insieme");
  assert.equal(result.body, "È stato pubblicato un nuovo ricordo del viaggio.");
  assert.ok(result.tag.length <= 96);
  assert.doesNotMatch(JSON.stringify(result), /<script>|B{100}|T{100}/);
  assert.equal(result.url, "/?post=post-1");
});

test("l'allarme tecnico resta generico e non espone dettagli dell'errore", () => {
  const result = sanitizePushPayload({
    tag: "technical-errore-123",
    body: "SQL con dati riservati",
    url: "/documents/passaporto",
  });
  assert.equal(result.title, "Thailandia Insieme");
  assert.match(result.body, /problema tecnico/);
  assert.equal(result.body.includes("SQL"), false);
  assert.equal(result.url, "/");
});
