import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("le nuove registrazioni richiedono consenso esplicito senza riscrivere i profili esistenti", async () => {
  const [worker, schema, migration] = await Promise.all([
    read("functions/api/[[path]].js"),
    read("db/schema.sql"),
    read("db/migrations/0017_profile_privacy_consent.sql"),
  ]);
  assert.match(worker, /body\.privacy_consent !== true/);
  assert.match(worker, /privacy_consent_at,privacy_consent_version/);
  assert.match(schema, /privacy_consent_at TEXT/);
  assert.match(migration, /ALTER TABLE profiles ADD COLUMN privacy_consent_at TEXT/);
  assert.doesNotMatch(migration, /UPDATE profiles|DELETE FROM profiles/i);
});

test("il consenso parte non selezionato ed è visibile nel modulo mobile", async () => {
  const [ui, css] = await Promise.all([read("src/main.jsx"), read("src/styles.css")]);
  assert.match(ui, /privacy_consent: false/);
  assert.match(ui, /type="checkbox"/);
  assert.match(ui, /Documenti e posizione restano nell’area privata/);
  assert.match(css, /\.privacyConsent/);
});
