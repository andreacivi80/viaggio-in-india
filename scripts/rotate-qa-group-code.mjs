import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const npxCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
const secretPath = join(root, ".wrangler", "qa-group-code.txt");
const secret = `qa-${randomBytes(24).toString("base64url")}`;
const result = spawnSync(process.execPath, [
  npxCli,
  "--yes",
  "wrangler@4.118.0",
  "pages",
  "secret",
  "put",
  "GROUP_CODE",
  "--project-name",
  "viaggio-in-india-2026-qa",
], {
  cwd: root,
  encoding: "utf8",
  windowsHide: true,
  shell: false,
  input: `${secret}\n`,
  maxBuffer: 8 * 1024 * 1024,
});
if (result.status !== 0)
  throw new Error(`Rotazione del codice QA non riuscita: ${String(result.stderr || result.stdout).slice(-1000)}`);
mkdirSync(dirname(secretPath), { recursive: true });
writeFileSync(secretPath, secret, { encoding: "utf8", mode: 0o600 });
console.log("QA_GROUP_CODE_ROTATED=ok");
