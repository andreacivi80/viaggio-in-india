import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");

test("leggere lo stato non riscrive la pubblicazione statica già corretta", () => {
  const start = source.indexOf("async function ensureStaticPosts");
  const end = source.indexOf("const futureIso", start);
  const implementation = source.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(implementation, /SELECT p\.author_name,p\.text,p\.created_at/);
  assert.match(implementation, /if \(current\?\.author_name === "Thailandia insieme"/);
  assert.match(implementation, /return;\s*await env\.DB\.batch/);
});
