import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("il passaggio dal vecchio dominio riusa il profilo autenticato e non crea duplicati", async () => {
  const worker = await read("functions/api/[[path]].js");
  const transfer = worker.slice(
    worker.indexOf('path === "auth/transfer"'),
    worker.indexOf('path === "auth/claim"'),
  );
  assert.match(transfer, /sessionFromRequest\(identityRequest, env\)/);
  assert.match(transfer, /if \(!session\).*401/);
  assert.match(transfer, /profile\.id,[\s\S]*profile\.id,[\s\S]*expiresAt/);
  assert.match(transfer, /futureIso\(1\)/);
  assert.match(transfer, /profile_domain_transfer_created/);
  assert.doesNotMatch(transfer, /INSERT INTO profiles/);
});

test("il recupero ha un percorso sul vecchio dominio prima del redirect generale", async () => {
  const ui = await read("src/main.jsx");
  const recovery = await read("redirect-old-site/recupera-accesso.html");
  assert.match(ui, /viaggio-in-india-2026\.pages\.dev\/recupera-accesso/);
  assert.match(recovery, /localStorage\.getItem\("india-session-token"\)/);
  assert.match(recovery, /localStorage\.getItem\("india-device-key"\)/);
  assert.match(recovery, /form\.method = "POST"/);
  assert.match(recovery, /form\.action = "https:\/\/viaggio-in-thailandia-2026\.pages\.dev\/api\/auth\/transfer"/);
  assert.doesNotMatch(recovery, /console\.log\(token/);
});

test("la registrazione rifiuta un profilo anagrafico già esistente", async () => {
  const worker = await read("functions/api/[[path]].js");
  const register = worker.slice(
    worker.indexOf('path === "auth/register"'),
    worker.indexOf('path === "auth/transfer"'),
  );
  assert.match(register, /lower\(trim\(name\)\)=lower\(trim\(\?\)\)/);
  assert.match(register, /PROFILE_EXISTS/);
  assert.match(register, /Recuperalo se è il tuo/);
  assert.match(register, /WHERE NOT EXISTS/);
  assert.match(register, /inserted\.meta\?\.changes/);
});

test("il modulo dal vecchio dominio usa la sessione esistente e torna con invito monouso", async () => {
  const worker = await read("functions/api/[[path]].js");
  const transfer = worker.slice(
    worker.indexOf('path === "auth/transfer"'),
    worker.indexOf('path === "auth/claim"'),
  );
  assert.match(transfer, /formTransfer/);
  assert.match(transfer, /origine del recupero non valida/i);
  assert.match(transfer, /sessionFromRequest\(identityRequest, env\)/);
  assert.match(transfer, /status: 303/);
  assert.match(transfer, /\/#invite=/);
  assert.doesNotMatch(transfer, /INSERT INTO profiles/);
});
