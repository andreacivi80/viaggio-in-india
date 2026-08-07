import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("la sessione familiare viene emessa e riutilizzata soltanto sul dispositivo autorizzato", async () => {
  const [worker, ui, schema] = await Promise.all([
    read("functions/api/[[path]].js"),
    read("src/main.jsx"),
    read("db/schema.sql"),
  ]);
  assert.match(worker, /INSERT INTO guest_sessions\(token_hash,visitor_id,display_name,device_key_hash/);
  assert.match(worker, /SELECT visitor_id,display_name,device_key_hash,expires_at/);
  assert.match(worker, /!guest\.device_key_hash \|\| !deviceKey/);
  assert.match(ui, /"x-guest-token": token, "x-device-key": deviceKey\(\)/);
  assert.match(schema, /guest_sessions[\s\S]*?device_key_hash TEXT/);
});

test("le sessioni ospite storiche senza binding vengono revocate", async () => {
  const migration = await read("db/migrations/0023_revoke_unbound_sessions.sql");
  assert.match(migration, /UPDATE guest_sessions[\s\S]*?WHERE device_key_hash IS NULL/);
});
