import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("la password comune crea soltanto viaggiatori", async () => {
  const [worker, ui] = await Promise.all([
    read("functions/api/[[path]].js"), read("src/main.jsx"),
  ]);
  const register = worker.slice(worker.indexOf('path === "auth/register"'), worker.indexOf('path === "auth/claim"'));
  assert.match(register, /const role = "traveler"/);
  assert.doesNotMatch(register, /body\.role === "coordinator"/);
  assert.doesNotMatch(ui.slice(ui.indexOf('className="bootstrapCoordinator travelerRegistration"'), ui.indexOf('currentProfile && verifiedSessionToken')), /setBootstrapForm\(\{ \.\.\.bootstrapForm, role: "coordinator"/);
});

test("la coordinatrice assegnata non può essere sostituita", async () => {
  const [worker, ui] = await Promise.all([
    read("functions/api/[[path]].js"), read("src/main.jsx"),
  ]);
  const createProfile = worker.slice(
    worker.indexOf('request.method === "POST" && path === "profiles"'),
    worker.indexOf('request.method === "PUT" && path.startsWith("profiles/")'),
  );
  const updateProfile = worker.slice(
    worker.indexOf('request.method === "PUT" && path.startsWith("profiles/")'),
    worker.indexOf('request.method === "DELETE" && path.startsWith("profiles/")'),
  );
  const deleteProfile = worker.slice(
    worker.indexOf('request.method === "DELETE" && path.startsWith("profiles/")'),
    worker.indexOf('request.method === "GET" && path === "documents"'),
  );

  assert.match(createProfile, /role: "traveler"/);
  assert.doesNotMatch(createProfile, /form\.get\("role"\) === "coordinator"/);
  assert.match(updateProfile, /const updatedRole = current\.role/);
  assert.doesNotMatch(updateProfile, /form\.get\("role"\) === "coordinator"/);
  assert.match(deleteProfile, /coordinator[\s\S]*non può essere eliminata/);
  assert.doesNotMatch(ui, /<option value="coordinator">/);
  assert.match(ui, /Coordinatrice assegnata/);
});

test("ogni membro del gruppo può eliminare i contenuti condivisi ma il pubblico no", async () => {
  const [worker, ui] = await Promise.all([
    read("functions/api/[[path]].js"), read("src/main.jsx"),
  ]);
  const statePost = worker.slice(worker.indexOf("can_manage: Boolean("), worker.indexOf("author_name: publicName(postProfileId"));
  const deletePost = worker.slice(
    worker.indexOf('request.method === "DELETE" && path.startsWith("posts/")'),
    worker.indexOf('request.method === "POST" && path === "comments"'),
  );
  const deleteComment = worker.slice(
    worker.indexOf('request.method === "DELETE" && path.startsWith("comments/")'),
    worker.indexOf('request.method === "POST" && path.startsWith("reactions/")'),
  );

  assert.match(statePost, /can_manage: Boolean\(session\)/);
  assert.match(deletePost, /if \(!session\).*Accesso personale richiesto/);
  assert.doesNotMatch(deletePost, /p\.profile_id !== session\.profile_id/);
  assert.match(deleteComment, /session \|\| \(guest && existing\.visitor_id === guest\.visitor_id\)/);
  assert.match(ui, /x\.can_manage \|\| x\.can_delete/);
});

test("le spunte del diario sono condivise e modificabili solo dal gruppo", async () => {
  const [worker, ui, migration] = await Promise.all([
    read("functions/api/[[path]].js"),
    read("src/main.jsx"),
    read("db/migrations/0025_shared_trip_checks.sql"),
  ]);
  const route = worker.slice(
    worker.indexOf('path.startsWith("trip-checks/")'),
    worker.indexOf('request.method === "GET" && path === "sync/version"'),
  );
  assert.match(route, /if \(!session\).*Accesso personale richiesto/);
  assert.match(route, /INSERT INTO trip_checks/);
  assert.match(worker, /trip_checks: Object\.fromEntries/);
  assert.match(ui, /disabled=\{!verifiedSessionToken\}/);
  assert.match(ui, /updateTripCheck\(k, e\.target\.checked\)/);
  assert.match(migration, /sync_trip_checks_(?:insert|update|delete)/);
});

test("solo il coordinatore verifica un documento e il server assegna il verificatore", async () => {
  const worker = await read("functions/api/[[path]].js");
  const documents = worker.slice(worker.indexOf('path === "documents" && request.method === "POST"'), worker.indexOf('path.startsWith("documents/")'));
  assert.match(documents, /ownsDocument && requestsFileChange/);
  assert.match(documents, /const verifiedBy = status === "verified"[\s\S]*?session\.name/);
  assert.doesNotMatch(documents, /String\(form\.get\("verified_by"\)/);
});

test("notifiche e caricamenti sono autenticati e limitati", async () => {
  const worker = await read("functions/api/[[path]].js");
  const push = worker.slice(worker.indexOf('path === "push/subscribe"'), worker.indexOf('path === "push/test"'));
  assert.match(push, /if \(!session && !guest\).*Identità richiesta/);
  assert.match(push, /rateLimit\([\s\S]*?"push-subscribe"/);
  assert.match(worker, /offset \+= 20/);
  assert.match(worker, /rateLimit\(env, request, "upload-init"/);
  assert.match(worker, /activeUploads[\s\S]*?>= 6/);
  assert.match(worker, /rateLimit\(env, request, "upload-part"/);
});

test("la cassaforte documenti accetta soltanto formati mobili espliciti", async () => {
  const [worker, validation] = await Promise.all([
    read("functions/api/[[path]].js"), read("functions/_lib/fileValidation.js"),
  ]);
  assert.match(worker, /application\\\/pdf\|image\\\/\(\?:jpeg\|jpg\|png\|webp\|heic\|heif\)/);
  assert.match(validation, /image\\\/\(\?:heic\|heif\)/);
});
