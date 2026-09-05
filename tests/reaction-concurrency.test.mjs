import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");
const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const migration = await readFile(new URL("../db/migrations/0026_single_reaction_per_person.sql", import.meta.url), "utf8");

test("il database ammette una sola reazione per persona e post", () => {
  assert.match(schema, /UNIQUE\(post_id, visitor_id\)/);
  assert.doesNotMatch(schema, /UNIQUE\(post_id, visitor_id, kind\)/);
  assert.match(migration, /DELETE FROM reactions\s+WHERE EXISTS/);
  assert.match(migration, /newer\.created_at > reactions\.created_at/);
  assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS reactions_person_post_unique/);
  assert.doesNotMatch(migration, /DROP TABLE/i);
});

test("il cambio emoji usa eliminazione condizionale e upsert concorrente", () => {
  assert.match(worker, /DELETE FROM reactions WHERE post_id=\? AND visitor_id=\? AND kind=\?/);
  assert.match(worker, /ON CONFLICT\(post_id,visitor_id\) DO UPDATE SET/);
  assert.match(worker, /kind=excluded\.kind/);
});
