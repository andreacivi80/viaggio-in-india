import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const npxCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
const query = `SELECT id,name,role,created_at FROM profiles WHERE id LIKE 'qa-%' ORDER BY created_at;`;
const result = spawnSync(process.execPath, [npxCli, "--yes", "wrangler@4.118.0", "d1", "execute", "viaggio-in-india-qa-db", "--remote", "--config", "wrangler.qa.jsonc", "--command", query], {
  cwd: root, encoding: "utf8", windowsHide: true, shell: false, maxBuffer: 8 * 1024 * 1024,
});
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
