import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("la chiave privata VAPID resta solo nel binding server", async () => {
  const worker = await readFile(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");
  const client = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
  const configs = (await readdir(root)).filter((name) => /^wrangler.*\.jsonc$/i.test(name));
  const configText = (await Promise.all(configs.map((name) => readFile(new URL(`../${name}`, import.meta.url), "utf8")))).join("\n");

  assert.match(worker, /env\.VAPID_PRIVATE_KEY/);
  assert.match(worker, /GET[\s\S]*push\/config[\s\S]*json\(\{ public_key: env\.VAPID_PUBLIC_KEY \|\| "" \}\)/);
  const configRoute = worker.slice(worker.indexOf('path === "push/config"'), worker.indexOf('path === "push/subscribe"'));
  assert.doesNotMatch(configRoute, /PRIVATE|private_key|VAPID_PRIVATE_KEY/);
  assert.doesNotMatch(client, /VAPID_PRIVATE_KEY|private_key/);
  assert.doesNotMatch(configText, /VAPID_PRIVATE_KEY\s*[:=]/);
});
