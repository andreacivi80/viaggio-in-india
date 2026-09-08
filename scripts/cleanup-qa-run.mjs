import { dirname, join, resolve } from "node:path";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const runId = process.argv.find((item) => item.startsWith("--run-id="))?.slice(9) || "";
if (!/^[a-f0-9]{32}$/i.test(runId)) throw new Error("run-id QA non valido");
const profilePattern = `qa-%-${runId}`;
const actorPattern = `profile:qa-%-${runId}`;
const temporaryDirectory = join(root, "artifacts", "qa-cleanup", runId);
const file = join(temporaryDirectory, "cleanup.sql");
mkdirSync(temporaryDirectory, { recursive: true });
writeFileSync(file, `
DELETE FROM comment_reactions WHERE actor_id LIKE '${actorPattern}' OR comment_id IN (SELECT id FROM comments WHERE profile_id LIKE '${profilePattern}');
DELETE FROM comments WHERE profile_id LIKE '${profilePattern}';
DELETE FROM reactions WHERE visitor_id LIKE '${profilePattern}';
DELETE FROM trip_checks WHERE updated_by LIKE '${profilePattern}';
DELETE FROM post_media WHERE post_id IN (SELECT id FROM posts WHERE profile_id LIKE '${profilePattern}');
DELETE FROM posts WHERE profile_id LIKE '${profilePattern}';
DELETE FROM document_status WHERE profile_id LIKE '${profilePattern}';
DELETE FROM locations WHERE profile_id LIKE '${profilePattern}';
DELETE FROM upload_parts WHERE upload_session_id IN (SELECT id FROM upload_sessions WHERE profile_id LIKE '${profilePattern}');
DELETE FROM upload_sessions WHERE profile_id LIKE '${profilePattern}';
DELETE FROM profile_invites WHERE profile_id LIKE '${profilePattern}' OR created_by LIKE '${profilePattern}';
DELETE FROM push_subscriptions WHERE profile_id LIKE '${profilePattern}';
DELETE FROM auth_sessions WHERE profile_id LIKE '${profilePattern}';
DELETE FROM profile_device_claims WHERE profile_id LIKE '${profilePattern}';
DELETE FROM security_audit_log WHERE actor_profile_id LIKE '${profilePattern}';
DELETE FROM guest_sessions WHERE display_name LIKE '%${runId}%';
DELETE FROM profiles WHERE id LIKE '${profilePattern}';
`, "utf8");
const npxCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
let result;
for (let attempt = 1; attempt <= 3; attempt += 1) {
  result = spawnSync(process.execPath, [npxCli, "--yes", "wrangler@4.118.0", "d1", "execute", "viaggio-in-india-qa-db", "--remote", "--config", "wrangler.qa.jsonc", "--file", file], {
    cwd: root, encoding: "utf8", windowsHide: true, shell: false, maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status === 0) break;
}
if (result?.stdout) process.stdout.write(result.stdout);
if (result?.stderr) process.stderr.write(result.stderr);
if (result?.error) throw result.error;
if (result?.status !== 0) throw new Error("Pulizia QA non riuscita dopo tre tentativi");
rmSync(temporaryDirectory, { recursive: true, force: true });
console.log(`QA_RUN_CLEANED=${runId}`);
