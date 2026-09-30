import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const branch = process.argv.find((argument) => argument.startsWith("--branch="))?.slice(9) || "main";
if (!/^[a-z0-9][a-z0-9-]{0,50}$/i.test(branch)) throw new Error("Nome branch non valido");
const npxCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
const result = spawnSync(process.execPath, [
  npxCli, "--yes", "wrangler@4.118.0", "pages", "deploy", "redirect-old-site",
  "--project-name", "viaggio-in-india-2026", "--branch", branch, "--commit-dirty=true",
], { cwd: root, encoding: "utf8", shell: false, windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`Deploy legacy non riuscito (${result.status})`);
