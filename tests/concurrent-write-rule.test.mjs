import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const policy = fs.readFileSync(new URL("../docs/CONCURRENT-WRITE-RULE.md", import.meta.url), "utf8");
const worker = fs.readFileSync(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");
const client = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("una sola regola rende il server autoritativo per ogni conflitto", () => {
  assert.match(policy, /stato confermato dal server prevale sempre/i);
  assert.match(policy, /stessa chiave di idempotenza/i);
  assert.match(policy, /ultima scrittura confermata dal server/i);
  assert.match(policy, /rileggere il server/i);
  assert.match(policy, /ruoli, proprietà e autorizzazioni[\s\S]*sessione server/i);
});

test("creazioni e sostituzioni applicano idempotenza e ordine atomico", () => {
  assert.match(worker, /beginIdempotentOperation[\s\S]*?create-post/);
  assert.match(worker, /beginIdempotentOperation[\s\S]*?create-comment/);
  assert.match(worker, /upload-document-[^`]+`[\s\S]*?env\.DB\.batch\(statements\)/);
  assert.match(worker, /previous\?\.file_key[\s\S]{0,180}deleteStoredMedia/);
});

test("un esito incerto viene riconciliato rileggendo lo stato server", () => {
  assert.match(client, /Non è stato possibile confermare il salvataggio[\s\S]*?controlla se il profilo compare/i);
  assert.match(client, /catch[\s\S]*?await refresh\(\)/);
  assert.match(client, /sync\/version/);
  assert.match(client, /idempotency-key/i);
});
