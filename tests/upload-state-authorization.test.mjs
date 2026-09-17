import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const worker = readFileSync(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");
const client = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");

test("A0136: il server autorizza proprietario e sessione prima di leggere o salvare upload", () => {
  const initStart = worker.indexOf('path === "uploads/init"');
  const initEnd = worker.indexOf("const uploadStatusMatch", initStart);
  const init = worker.slice(initStart, initEnd);
  assert.ok(initStart >= 0);
  assert.ok(init.indexOf("sessionFromRequest(request, env)") < init.indexOf("request.json()"));
  assert.ok(init.indexOf("if (!session)") < init.indexOf("INSERT INTO upload_sessions"));
  assert.ok(init.indexOf("validateUploadDescription") < init.indexOf("INSERT INTO upload_sessions"));

  const partStart = worker.indexOf("const uploadPartMatch");
  const partEnd = worker.indexOf("const uploadCompleteMatch", partStart);
  const part = worker.slice(partStart, partEnd);
  assert.ok(part.indexOf("sessionFromRequest(request, env)") < part.indexOf("request.arrayBuffer()"));
  assert.ok(part.indexOf("upload.profile_id !== session.profile_id") < part.indexOf("request.arrayBuffer()"));
  assert.ok(part.indexOf("validateFileBytes") < part.indexOf("persistUploadPart"));
});

test("A0290: dopo il caricamento dati i comandi restano derivati dalla sessione verificata", () => {
  assert.match(client, /const publicationStep = publicationAccessStep\(\{ sessionToken, groupCode \}\)/);
  assert.match(client, /publicationStep === "composer"/);
  const refreshStart = client.indexOf("const refresh = async");
  const refreshEnd = client.indexOf("const updateTripCheck", refreshStart);
  const refresh = client.slice(refreshStart, refreshEnd);
  assert.match(refresh, /setStateLoaded\(true\)/);
  assert.doesNotMatch(refresh, /setSessionToken|setGroupCode|setSessionProfile/);
  assert.match(client, /if \(stateLoaded\) setSessionNotice\("Contenuto non più disponibile\."\)/);
});
