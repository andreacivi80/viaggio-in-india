import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const files = readdirSync("tests")
  .filter((name) => name.endsWith(".test.mjs") && name !== "production-smoke.test.mjs")
  .map((name) => `tests/${name}`)
  .sort();

const result = spawnSync(process.execPath, ["--test", ...files], {
  stdio: "inherit",
  shell: false,
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
