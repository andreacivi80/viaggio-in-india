import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const decision = readFileSync(new URL("../docs/SESSION-TOKEN-DECISION.md", import.meta.url), "utf8");

test("la valutazione HttpOnly documenta benefici, rischi e migrazione completa", () => {
  assert.match(decision, /Secure; HttpOnly; SameSite=Strict/);
  assert.match(decision, /protezione CSRF/);
  assert.match(decision, /binding al dispositivo/);
  assert.match(decision, /rilasciata atomicamente/);
  assert.match(decision, /rollback verificato/);
});
