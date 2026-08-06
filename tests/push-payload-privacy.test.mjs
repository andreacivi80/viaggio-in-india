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
  assert.equal(result.title, "India Insieme");
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
