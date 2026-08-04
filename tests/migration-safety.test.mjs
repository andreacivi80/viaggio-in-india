import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const migrationDirectory = new URL("../db/migrations/", import.meta.url);
const coreTables = "profiles|posts|post_media|comments|reactions|document_status|locations";

test("le migrazioni sono numerate, additive e non cancellano dati reali", async () => {
  const names = (await readdir(migrationDirectory)).filter((name) => name.endsWith(".sql")).sort();
  assert.equal(new Set(names.map((name) => name.slice(0, 4))).size, names.length);
  for (const name of names) {
    const sql = await readFile(new URL(name, migrationDirectory), "utf8");
    assert.doesNotMatch(sql, /\bDROP\s+(?:TABLE|COLUMN)\b/i, `${name}: DROP distruttivo`);
    assert.doesNotMatch(sql, /\bTRUNCATE\b/i, `${name}: TRUNCATE distruttivo`);
    assert.doesNotMatch(sql, new RegExp(`\\bDELETE\\s+FROM\\s+(?:${coreTables})\\b`, "i"), `${name}: DELETE sui dati reali`);
    for (const statement of sql.split(";")) {
      if (new RegExp(`^\\s*UPDATE\\s+(?:${coreTables})\\b`, "i").test(statement))
        assert.match(statement, /\bWHERE\b/i, `${name}: UPDATE globale senza WHERE`);
    }
  }
});

test("il runner QA usa identificativi isolati e pulizie circoscritte", async () => {
  const runner = await readFile(new URL("../scripts/run-authenticated-qa.ps1", import.meta.url), "utf8");
  assert.match(runner, /qa-owner-\$runId/);
  assert.match(runner, /WHERE profile_id IN \(\$quotedIds\)/);
  assert.doesNotMatch(runner, /DELETE FROM guest_sessions[^\n]*LIKE/i);
  assert.doesNotMatch(runner, /DELETE FROM profiles\s*;/i);
  assert.doesNotMatch(runner, /DELETE FROM posts\s*;/i);
});

test("il collaudo UI usa soltanto la coppia QA isolata", async () => {
  const source = await readFile(new URL("../scripts/run-ui-critical.ps1", import.meta.url), "utf8");
  assert.match(source, /\$profileId = "qa-ui-\$runId"/i);
  assert.match(source, /\$coordinatorId = "qa-ui-coordinator-\$runId"/i);
  assert.doesNotMatch(source, /DELETE FROM profiles\s*;/i);
  assert.doesNotMatch(source, /DELETE FROM profiles[^\n]*LIKE/i);
  assert.match(source, /DELETE FROM profiles WHERE id IN \('\$profileId','\$coordinatorId'\)/i);
});
