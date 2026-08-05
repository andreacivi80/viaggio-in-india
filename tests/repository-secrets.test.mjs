import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

test("password e file token non sono tracciati nel repository", async () => {
  const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
  assert.ok(!tracked.some((path) => /(?:^|\/)\.env(?:\.|$)/i.test(path) && !path.endsWith(".env.example")));
  assert.ok(!tracked.some((path) => /device-token\.json$/i.test(path)));
  const knownGroupCode = ["india", "26"].join("");
  const scan = tracked.filter((path) => /^(?:src|public|tests|scripts)\//.test(path) && /\.(?:js|mjs|jsx|json|ps1)$/i.test(path));
  for (const path of scan) {
    const source = await readFile(path, "utf8");
    assert.ok(!source.toLowerCase().includes(knownGroupCode), `${path}: password comune scritta nel file`);
  }
});

test("la build esegue obbligatoriamente la scansione del client", async () => {
  const packageData = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.match(packageData.scripts.build, /scan-client-secrets\.mjs/);
});
