import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const migrationDirectory = new URL("../db/migrations/", import.meta.url);
const coreTables = "profiles|posts|post_media|comments|reactions|document_status|locations|security_audit_log";

test("le migrazioni sono numerate, additive e non cancellano dati reali", async () => {
  const names = (await readdir(migrationDirectory)).filter((name) => name.endsWith(".sql")).sort();
  const byNumber = new Map();
  for (const name of names) {
    const number = name.slice(0, 4);
    byNumber.set(number, [...(byNumber.get(number) || []), name]);
  }
  const legacyDuplicates = [...byNumber.values()].filter((group) => group.length > 1);
  assert.deepEqual(legacyDuplicates, [[
    "0010_post_visibility_and_push_audience.sql",
    "0010_profile_gender.sql",
  ]], "sono ammesse soltanto le due migrazioni storiche 0010 già applicate");
  for (const name of names) {
    const sql = await readFile(new URL(name, migrationDirectory), "utf8");
    assert.doesNotMatch(sql, /\bDROP\s+(?:TABLE|COLUMN)\b/i, `${name}: DROP distruttivo`);
    assert.doesNotMatch(sql, /\bTRUNCATE\b/i, `${name}: TRUNCATE distruttivo`);
    for (const statement of sql.split(";")) {
      if (new RegExp(`^\\s*UPDATE\\s+(?:${coreTables})\\b`, "i").test(statement))
        assert.match(statement, /\bWHERE\b/i, `${name}: UPDATE globale senza WHERE`);
      if (new RegExp(`(?:^|\\bBEGIN\\s+)\\s*DELETE\\s+FROM\\s+(?:${coreTables})\\b`, "i").test(statement))
        assert.match(statement, /\bWHERE\b/i, `${name}: DELETE globale senza WHERE`);
    }
  }
});

test("il database impedisce sessioni e inviti senza un profilo valido", async () => {
  const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
  const migration = await readFile(new URL("../db/migrations/0016_auth_profile_integrity.sql", import.meta.url), "utf8");
  for (const source of [schema, migration]) {
    assert.match(source, /auth_sessions_profile_insert_guard/);
    assert.match(source, /profile_invites_profile_insert_guard/);
    assert.match(source, /auth_profile_delete_cleanup/);
    assert.match(source, /NOT EXISTS \(SELECT 1 FROM profiles WHERE id = NEW\.profile_id\)/);
  }
});

test("il database impedisce documenti collegati a profili inesistenti", async () => {
  const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
  const migration = await readFile(new URL("../db/migrations/0021_document_profile_integrity.sql", import.meta.url), "utf8");
  for (const source of [schema, migration]) {
    assert.match(source, /document_profile_insert_guard/);
    assert.match(source, /document_profile_update_guard/);
    assert.match(source, /BEFORE UPDATE OF profile_id ON document_status/);
    assert.match(source, /NOT EXISTS \(SELECT 1 FROM profiles WHERE id = NEW\.profile_id\)/);
  }
});

test("il database impedisce posizioni orfane e le elimina con il profilo", async () => {
  const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
  const migration = await readFile(new URL("../db/migrations/0022_location_profile_integrity.sql", import.meta.url), "utf8");
  for (const source of [schema, migration]) {
    assert.match(source, /location_profile_insert_guard/);
    assert.match(source, /location_profile_update_guard/);
    assert.match(source, /private_profile_delete_cleanup/);
    assert.match(source, /DELETE FROM locations WHERE profile_id = OLD\.id/);
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
  assert.match(source, /TestFiles\.Count -ne 1/);
  assert.match(source, /viaggio-in-india-2026-qa\\\.pages\\\.dev/);
  assert.match(source, /Protezione dati:/);
  const uiCritical = await readFile(new URL("../tests/ui-critical.spec.mjs", import.meta.url), "utf8");
  assert.match(uiCritical, /QA_UI_ALLOW_REGISTRATION/);
  assert.match(uiCritical, /viaggio-in-india-2026-qa\\\.pages\\\.dev/);
});

test("tutte le suite scriventi rifiutano il dominio ufficiale", async () => {
  const smoke = await readFile(new URL("../tests/production-smoke.test.mjs", import.meta.url), "utf8");
  assert.match(smoke, /const canMutate =/);
  assert.match(smoke, /viaggio-in-india-2026-qa\.pages\.dev/);
  assert.match(smoke, /skip: !canMutate/);
  const authenticated = await readFile(new URL("../scripts/run-authenticated-qa.ps1", import.meta.url), "utf8");
  assert.match(authenticated, /viaggio-in-india-2026-qa\\\.pages\\\.dev/);
  assert.match(authenticated, /Protezione dati:/);
  const liveProfileDeletion = await readFile(new URL("../tests/qa-live-profile-deletion.mjs", import.meta.url), "utf8");
  assert.match(liveProfileDeletion, /viaggio-in-india-2026-qa\.pages\.dev/);
  assert.match(liveProfileDeletion, /Protezione dati:/);
});

test("il deploy QA usa obbligatoriamente i binding QA", async () => {
  const packageSource = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const command = packageSource.scripts["deploy:qa"];
  assert.match(command, /scripts\/deploy-qa\.ps1/);
  assert.doesNotMatch(command, /--project-name viaggio-in-india-2026(?:\s|$)/);
  const deployScript = await readFile(new URL("../scripts/deploy-qa.ps1", import.meta.url), "utf8");
  assert.match(deployScript, /wrangler\.qa\.jsonc/);
  assert.match(deployScript, /Destination \(Join-Path \$deployRoot "wrangler\.jsonc"\)/);
  assert.match(deployScript, /ItemType Junction[\s\S]*?\$deployRoot "node_modules"/);
  assert.match(deployScript, /"viaggio-in-india-qa-db"/);
  assert.match(deployScript, /--cwd \$deployRoot/);
  const qaConfig = await readFile(new URL("../wrangler.qa.jsonc", import.meta.url), "utf8");
  assert.match(qaConfig, /"name": "viaggio-in-india-2026-qa"/);
  assert.match(qaConfig, /"database_name": "viaggio-in-india-qa-db"/);
  const sessionDeploy = await readFile(new URL("../scripts/deploy-cloudflare-session.ps1", import.meta.url), "utf8");
  assert.match(sessionDeploy, /deploy-qa\.ps1/);
  assert.doesNotMatch(sessionDeploy, /--project-name viaggio-in-india-2026-qa/);
  assert.match(sessionDeploy, /wait-deployment-ready\.ps1/);
  assert.match(sessionDeploy, /viaggio-in-india-2026-qa\.pages\.dev/);
  assert.match(sessionDeploy, /viaggio-in-india-2026\.pages\.dev/);
  const readiness = await readFile(new URL("../scripts/wait-deployment-ready.ps1", import.meta.url), "utf8");
  assert.match(readiness, /api\/health/);
  assert.match(readiness, /api\/private/);
  assert.match(readiness, /consecutivePasses -ge 2/);
  assert.match(readiness, /Contains\(\$ExpectedVersion\)/);
});
