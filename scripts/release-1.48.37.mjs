import { mkdirSync, readFileSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const version = "1.48.37";
const repositoryFiles = [
  "db/schema.sql",
  "db/migrations/0030_comment_conversations.sql",
  "docs/API-AUTHORIZATION-INVENTORY.json",
  "docs/AUTHORIZATION-MATRIX.md",
  "docs/CONTROL-COVERAGE.csv",
  "docs/CONTROL-COVERAGE.md",
  "docs/CONTROL-EVIDENCE.json",
  "docs/CRITICAL-CONTROLS-1.41.1.csv",
  "docs/CRITICAL-CONTROLS-1.41.1.md",
  "docs/TEST-MATRIX.md",
  "functions/api/[[path]].js",
  "package.json",
  "package-lock.json",
  "public/sw.js",
  "scripts/run-authenticated-qa.ps1",
  "scripts/run-level1-gate.ps1",
  "scripts/run-ui-bootstrap.ps1",
  "src/main.jsx",
  "src/styles.css",
  "tests/comment-conversations.test.mjs",
  "tests/database-unavailable.test.mjs",
  "tests/endpoint-authorization-inventory.test.mjs",
  "tests/extended-p2-comment-conversations.mjs",
  "tests/migration-safety.test.mjs",
  "tests/ui-comment-conversations.spec.mjs",
  "tests/ui-endpoint-authorization-alignment.test.mjs",
  "scripts/release-1.48.37.mjs",
];

function execute(command, args, options = {}) {
  let executable = command;
  let executableArgs = args;
  if (process.platform === "win32" && ["npm", "npx"].includes(command)) {
    executable = process.execPath;
    executableArgs = [
      join(dirname(process.execPath), "node_modules", "npm", "bin", command === "npm" ? "npm-cli.js" : "npx-cli.js"),
      ...args,
    ];
  }
  const result = spawnSync(executable, executableArgs, {
    cwd: root,
    encoding: "utf8",
    windowsHide: true,
    shell: false,
    env: { ...process.env, ...(options.env || {}) },
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} non riuscito (${result.status})`);
  return `${result.stdout || ""}\n${result.stderr || ""}`;
}

async function deploymentReady(baseUrl) {
  for (let attempt = 1; attempt <= 18; attempt += 1) {
    const separator = baseUrl.includes("?") ? "&" : "?";
    const htmlResponse = await fetch(`${baseUrl}${separator}release=${version}-${attempt}`, { cache: "no-store" }).catch(() => null);
    if (htmlResponse?.ok) {
      const html = await htmlResponse.text();
      const assetPath = html.match(/\/assets\/index-[^"']+\.js/)?.[0];
      if (assetPath) {
        const bundleResponse = await fetch(new URL(assetPath, baseUrl), { cache: "no-store" }).catch(() => null);
        if (bundleResponse?.ok && (await bundleResponse.text()).includes(version)) {
          console.log(`DEPLOYMENT_READY=${baseUrl}`);
          return;
        }
      }
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 5000));
  }
  throw new Error(`La revisione ${version} non è diventata stabile su ${baseUrl}`);
}

console.log("RELEASE_STEP=STATIC_TESTS");
execute("npm", ["test"]);

console.log("RELEASE_STEP=COMMIT");
execute("git", ["add", "--", ...repositoryFiles]);
execute("git", ["diff", "--cached", "--check"]);
execute("git", ["commit", "-m", "Add replies and reactions to comments"]);
execute("git", ["push", "origin", "main"]);

console.log("RELEASE_STEP=PRODUCTION_BACKUP");
const backupDirectory = join(root, "artifacts", "backups");
mkdirSync(backupDirectory, { recursive: true });
const backupPath = join(backupDirectory, `pre-${version}-${new Date().toISOString().replace(/[:.]/g, "-")}.sql`);
execute("npx", ["--yes", "wrangler@4.118.0", "d1", "export", "viaggio-in-india-db", "--remote", "--config", "wrangler.jsonc", "--output", backupPath]);
const backupText = readFileSync(backupPath, "utf8");
if (statSync(backupPath).size < 1000 || !/CREATE TABLE comments/i.test(backupText))
  throw new Error("Backup produzione non verificabile: migrazione annullata");
console.log(`BACKUP_VERIFIED_BYTES=${statSync(backupPath).size}`);

console.log("RELEASE_STEP=PRODUCTION_MIGRATION");
const schemaBefore = execute("npx", ["--yes", "wrangler@4.118.0", "d1", "execute", "viaggio-in-india-db", "--remote", "--config", "wrangler.jsonc", "--command", "PRAGMA table_info(comments); SELECT name FROM sqlite_master WHERE type='table' AND name='comment_reactions';"]);
if (!(schemaBefore.includes("parent_comment_id") && schemaBefore.includes("comment_reactions"))) {
  execute("npx", ["--yes", "wrangler@4.118.0", "d1", "execute", "viaggio-in-india-db", "--remote", "--config", "wrangler.jsonc", "--file", "db/migrations/0030_comment_conversations.sql"]);
}
execute("npx", ["--yes", "wrangler@4.118.0", "d1", "execute", "viaggio-in-india-db", "--remote", "--config", "wrangler.jsonc", "--command", "INSERT INTO d1_migrations(name) SELECT '0030_comment_conversations.sql' WHERE NOT EXISTS (SELECT 1 FROM d1_migrations WHERE name='0030_comment_conversations.sql');"]);
const schemaAfter = execute("npx", ["--yes", "wrangler@4.118.0", "d1", "execute", "viaggio-in-india-db", "--remote", "--config", "wrangler.jsonc", "--command", "PRAGMA table_info(comments); SELECT name FROM sqlite_master WHERE type='table' AND name='comment_reactions';"]);
if (!(schemaAfter.includes("parent_comment_id") && schemaAfter.includes("comment_reactions")))
  throw new Error("Verifica schema produzione non superata");

console.log("RELEASE_STEP=PRODUCTION_DEPLOY");
const deployOutput = execute("npx", ["--yes", "wrangler@4.118.0", "pages", "deploy", "dist", "--project-name", "viaggio-in-thailandia-2026", "--branch", "main", "--commit-dirty=true"]);
const deploymentUrl = deployOutput.match(/https:\/\/[a-z0-9-]+\.viaggio-in-thailandia-2026\.pages\.dev/)?.[0];
if (!deploymentUrl) throw new Error("URL della pubblicazione non rilevato");
await deploymentReady(deploymentUrl);
await deploymentReady("https://viaggio-in-thailandia-2026.pages.dev");

console.log("RELEASE_STEP=PRODUCTION_SMOKE_X2");
const smokeEnvironment = {
  TEST_BASE_URL: "https://viaggio-in-thailandia-2026.pages.dev",
  TEST_EXPECTED_VERSION: version,
};
execute("node", ["--test", "--test-concurrency=1", "tests/production-smoke.test.mjs"], { env: smokeEnvironment });
execute("node", ["--test", "--test-concurrency=1", "tests/production-smoke.test.mjs"], { env: smokeEnvironment });
console.log(`RELEASE_COMPLETE=${version};SOURCE_CONTROLS=1121/2848;PERCENT=39.36`);
