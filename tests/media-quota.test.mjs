import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { MAX_POST_MEDIA_BYTES } from "../functions/api/[[path]].js";

const worker = await readFile(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");

test("ogni post ha un limite totale esplicito anche con dieci allegati", () => {
  assert.equal(MAX_POST_MEDIA_BYTES, 600 * 1024 * 1024);
  assert.match(worker, /files\.reduce\([\s\S]*uploadedMedia\.reduce/);
  assert.match(worker, /requestedMediaBytes > MAX_POST_MEDIA_BYTES[\s\S]*status[^]*413|requestedMediaBytes > MAX_POST_MEDIA_BYTES[\s\S]*}, 413\)/);
  assert.match(worker, /files\.length \+ uploadIds\.length > 10/);
});

test("inizializzazione e parti applicano quote e limiti anticonsumo", () => {
  assert.match(worker, /rateLimit\(env, request, "upload-init", 20, 600/);
  assert.match(worker, /activeUploads[^]*total[^]*>= 6/);
  assert.match(worker, /activeUploads[^]*bytes[^]*1024 \* 1024 \* 1024/);
  assert.match(worker, /rateLimit\(env, request, "upload-part", 300, 600/);
  assert.match(worker, /scope === "document"[^]*80 \* 1024 \* 1024/);
  assert.match(worker, /contentType\.startsWith\("video\/"\)[^]*500 \* 1024 \* 1024/);
});

test("gli upload incompleti scadono e vengono rimossi periodicamente", () => {
  assert.match(worker, /Date\.now\(\) - lastRun < 6 \* 60 \* 60 \* 1000/);
  assert.match(worker, /status!='consumed' AND expires_at<\? LIMIT 25/);
  assert.match(worker, /for \(const upload of expiredUploads\.results\)[\s\S]*deleteStoredMedia/);
  assert.match(worker, /futureIso\(48\)/);
});
