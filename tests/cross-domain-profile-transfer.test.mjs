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
  assert.match(transfer, /sessionFromRequest\(request, env\)/);
  assert.match(transfer, /if \(!session\).*401/);
  assert.match(transfer, /profile\.id,[\s\S]*profile\.id,[\s\S]*expiresAt/);
  assert.match(transfer, /futureIso\(1\)/);
  assert.match(transfer, /profile_domain_transfer_created/);
  assert.doesNotMatch(transfer, /INSERT INTO profiles/);
});

test("il token di passaggio viaggia nel frammento e viene consumato dal claim esistente", async () => {
  const ui = await read("src/main.jsx");
  const transfer = ui.slice(
    ui.indexOf('location.hostname !== "viaggio-in-india-2026.pages.dev"'),
    ui.indexOf("const handleInvite"),
  );
  assert.match(transfer, /localStorage\.getItem\("india-session-token"\)/);
  assert.match(transfer, /fetch\(`\$\{API\}\/auth\/transfer`/);
  assert.match(transfer, /sessionHeaders\(legacyToken\)/);
  assert.match(transfer, /viaggio-in-thailandia-2026\.pages\.dev\/#invite=/);
  assert.doesNotMatch(transfer, /\?invite=/);
  assert.match(ui, /Hai già un profilo\? Recuperalo dal vecchio link/);
});

test("la registrazione rifiuta un profilo anagrafico già esistente", async () => {
  const worker = await read("functions/api/[[path]].js");
  const register = worker.slice(
    worker.indexOf('path === "auth/register"'),
    worker.indexOf('path === "auth/transfer"'),
  );
  assert.match(register, /lower\(trim\(name\)\)=lower\(trim\(\?\)\)/);
  assert.match(register, /PROFILE_EXISTS/);
  assert.match(register, /Recupera l’accesso dal vecchio link/);
});
