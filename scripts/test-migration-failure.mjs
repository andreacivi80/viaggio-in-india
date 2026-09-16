import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const persistence = mkdtempSync(join(tmpdir(), "thailandia-migration-failure-"));
const npxCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");

const execute = (sql, expectedStatus = 0) => {
  const result = spawnSync(process.execPath, [
    npxCli, "--yes", "wrangler@4.118.0", "d1", "execute", "viaggio-in-india-qa-db",
    "--local", "--config", join(root, "wrangler.qa.jsonc"), "--persist-to", persistence,
    "--command", sql, "--json",
  ], { cwd: root, encoding: "utf8", windowsHide: true, shell: false, maxBuffer: 8 * 1024 * 1024 });
  assert.equal(result.status, expectedStatus, result.stderr || result.stdout);
  return `${result.stdout}\n${result.stderr}`;
};
const executeFile = (path, expectedStatus = 0) => {
  const result = spawnSync(process.execPath, [
    npxCli, "--yes", "wrangler@4.118.0", "d1", "execute", "viaggio-in-india-qa-db",
    "--local", "--config", join(root, "wrangler.qa.jsonc"), "--persist-to", persistence,
    "--file", path, "--json",
  ], { cwd: root, encoding: "utf8", windowsHide: true, shell: false, maxBuffer: 8 * 1024 * 1024 });
  assert.equal(result.status, expectedStatus, result.stderr || result.stdout);
  return `${result.stdout}\n${result.stderr}`;
};

try {
  execute("CREATE TABLE migration_probe(id INTEGER PRIMARY KEY, value TEXT NOT NULL); INSERT INTO migration_probe(id,value) VALUES(1,'original');");
  const failingMigration = join(persistence, "failing-migration.sql");
  writeFileSync(failingMigration, "UPDATE migration_probe SET value='corrotto' WHERE id=1;\nINSERT INTO tabella_inesistente(id) VALUES(1);\n", "utf8");
  const failed = executeFile(failingMigration, 1);
  assert.match(failed, /tabella_inesistente|no such table/i);
  const verification = execute("SELECT id,value FROM migration_probe WHERE id=1;");
  assert.match(verification, /original/);
  assert.doesNotMatch(verification, /corrotto/);
  console.log("MIGRATION_FAILURE_ROLLBACK=1/1");
} finally {
  rmSync(persistence, { recursive: true, force: true });
}
