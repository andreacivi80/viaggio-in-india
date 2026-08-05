import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("il rinnovo ruota atomicamente il token e restituisce solo quello nuovo", async () => {
  const worker = await read("functions/api/[[path]].js");
  assert.match(worker, /const nextToken = secureToken\(\)/);
  assert.match(worker, /UPDATE auth_sessions SET token_hash=\?,last_used_at=\?,expires_at=\?/);
  assert.match(worker, /return json\(\{ ok: true, token: nextToken, expires_at: expiresAt \}\)/);
});

test("il client sostituisce immediatamente il token dopo il rinnovo", async () => {
  const ui = await read("src/main.jsx");
  assert.match(ui, /const refreshedSession = await refreshed\.json\(\)/);
  assert.match(ui, /localStorage\.setItem\("india-session-token", refreshedSession\.token\)/);
  assert.match(ui, /setSessionToken\(refreshedSession\.token\)/);
});
