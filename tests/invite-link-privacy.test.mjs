import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("i nuovi inviti tengono il segreto fuori dalla query inviata al server", async () => {
  const ui = await read("src/main.jsx");
  assert.match(ui, /inviteUrl\.hash = new URLSearchParams\(\{ invite: result\.invite_token \}\)\.toString\(\)/);
  assert.doesNotMatch(ui, /inviteUrl\.searchParams\.set\("invite", result\.invite_token\)/);
});

test("il token viene rimosso dalla barra prima del claim e i vecchi link restano compatibili", async () => {
  const ui = await read("src/main.jsx");
  const start = ui.indexOf("const hashParams = new URLSearchParams");
  const claim = ui.indexOf("fetch(`${API}/auth/claim`", start);
  const cleanup = ui.indexOf("history.replaceState({}, \"\", cleanUrl)", start);
  assert.ok(start >= 0 && cleanup > start && claim > cleanup, "la pulizia deve precedere la richiesta al server");
  assert.match(ui.slice(start, claim), /new URLSearchParams\(location\.search\)\.get\("invite"\)/);
  assert.match(ui.slice(start, claim), /cleanUrl\.hash = ""/);
});

test("l’invito è legato al profilo, scade e viene consumato atomicamente una sola volta", async () => {
  const worker = await read("functions/api/[[path]].js");
  assert.match(worker, /const expiresAt = futureIso\(48\)/);
  assert.match(worker, /INSERT INTO profile_invites\(token_hash,profile_id,created_by,created_at,expires_at,used_at\)/);
  assert.match(worker, /WHERE i\.token_hash=\? AND i\.used_at IS NULL AND i\.expires_at>\?/);
  assert.match(worker, /UPDATE profile_invites SET used_at=\? WHERE token_hash=\? AND used_at IS NULL/);
  assert.match(worker, /profile: \{[\s\S]*?id: invite\.profile_id/);
});
