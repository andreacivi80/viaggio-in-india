import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("CSP impedisce l'incorporamento da origini esterne", async () => {
  const [headers, worker] = await Promise.all([
    read("public/_headers"),
    read("functions/api/[[path]].js"),
  ]);
  assert.match(headers, /content-security-policy:[^\r\n]*frame-ancestors 'self'/i);
  assert.match(worker, /"content-security-policy":\s*"default-src 'none'; frame-ancestors 'none'"/i);
});

test("ogni risposta API JSON sensibile vieta la cache condivisa", async () => {
  const worker = await read("functions/api/[[path]].js");
  const jsonHelper = worker.slice(worker.indexOf("const json ="), worker.indexOf("const id ="));
  assert.match(jsonHelper, /["']cache-control["']:\s*["']no-store["']/i);
  assert.match(jsonHelper, /responseSecurityHeaders/);
});

test("produzione e QA usano archivi MEDIA separati e il Worker usa solo il binding", async () => {
  const [productionText, qaText, worker, client] = await Promise.all([
    read("wrangler.jsonc"),
    read("wrangler.qa.jsonc"),
    read("functions/api/[[path]].js"),
    read("src/main.jsx"),
  ]);
  const production = JSON.parse(productionText);
  const qa = JSON.parse(qaText);
  const media = (config) => config.kv_namespaces.find((entry) => entry.binding === "MEDIA");
  assert.ok(media(production)?.id);
  assert.ok(media(qa)?.id);
  assert.notEqual(media(production).id, media(qa).id);
  assert.match(worker, /env\.MEDIA\.(?:get|put|delete)\(/);
  assert.doesNotMatch(client, new RegExp(`${media(production).id}|${media(qa).id}`, "i"));
});

test("gli errori interni non espongono messaggi o segreti del server", async () => {
  const worker = await read("functions/api/[[path]].js");
  const handler = worker.slice(worker.lastIndexOf("} catch (error)"));
  assert.match(handler, /status >= 500[\s\S]*Servizio temporaneamente non disponibile\. Riprova\./);
  assert.match(handler, /error_id/);
  assert.doesNotMatch(handler, /JSON\.stringify\(error\)|stack|env\.(?:GROUP_CODE|VAPID_PRIVATE_KEY)/);
});
