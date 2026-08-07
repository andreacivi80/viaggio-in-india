import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ogni nuova sessione è legata a una chiave casuale del dispositivo", async () => {
  const [worker, ui, schema] = await Promise.all([
    read("functions/api/[[path]].js"),
    read("src/main.jsx"),
    read("db/schema.sql"),
  ]);
  assert.match(ui, /crypto\.getRandomValues\(new Uint8Array\(32\)\)/);
  assert.match(ui, /"india-device-key"/);
  assert.match(ui, /"x-device-key": deviceKey\(\)/);
  assert.match(worker, /device_key_hash/);
  assert.match(worker, /\(await tokenHash\(deviceKey\)\) !== session\.device_key_hash/);
  assert.match(worker, /Identità dispositivo non valida/);
  assert.match(schema, /device_key_hash TEXT/);
});

test("le sessioni storiche senza binding vengono revocate e falliscono in modo chiuso", async () => {
  const [worker, migration] = await Promise.all([
    read("functions/api/[[path]].js"),
    read("db/migrations/0023_revoke_unbound_sessions.sql"),
  ]);
  assert.match(worker, /!session\.device_key_hash \|\| !deviceKey/);
  assert.match(migration, /UPDATE auth_sessions[\s\S]*?WHERE device_key_hash IS NULL/);
});
