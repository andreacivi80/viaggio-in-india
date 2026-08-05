import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const worker = await readFile("functions/api/[[path]].js", "utf8");
const client = await readFile("src/main.jsx", "utf8");

async function sourceFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await sourceFiles(path));
    else if (/\.(?:js|jsx|mjs|ts|tsx|json|html)$/i.test(entry.name)) result.push(path);
  }
  return result;
}

test("codice di gruppo e token non sono incorporati nel client", async () => {
  const files = ["index.html", ...await sourceFiles("src"), ...await sourceFiles("public")];
  const forbidden = [
    /india\s*26/i,
    /(?:api[_-]?key|api[_-]?token|private[_-]?key|vapid[_-]?private)\s*[:=]\s*["'][^"']{8,}/i,
    /bearer\s+[a-z0-9._~-]{20,}/i,
  ];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const expression of forbidden)
      assert.equal(expression.test(source), false, `${file} contiene un segreto o token client`);
  }
});

test("le risposte API e i contenuti privati vietano la cache condivisa", () => {
  assert.match(worker, /"cache-control":\s*"no-store"/);
  assert.match(worker, /key\.startsWith\("chunked\/public\/"\)[\s\S]*?"private, no-store"/);
  assert.match(worker, /key\.startsWith\("public\/"\)[\s\S]*?"private, no-store"/);
});

test("la password comune viene verificata solo contro il segreto del server", () => {
  assert.match(worker, /Boolean\(env\.GROUP_CODE\)[\s\S]*?x-group-code["']\)\s*===\s*env\.GROUP_CODE/);
  for (const route of ["auth/bootstrap", "auth/group", "auth/unlock", "auth/register"])
    assert.match(worker, new RegExp(`path === ["']${route.replace("/", "\\/")}["'][\\s\\S]{0,900}?groupOk\\(request, env\\)`));
});

test("sessioni e inviti usano token casuali memorizzati soltanto come hash", () => {
  assert.match(worker, /crypto\.getRandomValues\(new Uint8Array\(32\)\)/);
  assert.match(worker, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(worker, /INSERT INTO auth_sessions\(token_hash[\s\S]*?await tokenHash\(token\)/);
  assert.match(worker, /INSERT INTO profile_invites\(token_hash[\s\S]*?await tokenHash\(token\)/);
  assert.doesNotMatch(worker, /INSERT INTO auth_sessions\(token,/);
});

test("sessioni revocate, scadute o inattive non vengono accettate", () => {
  assert.match(worker, /s\.revoked_at IS NULL AND s\.expires_at>\?/);
  assert.match(worker, /COALESCE\(s\.last_used_at,s\.created_at\)>\?/);
  assert.match(worker, /UPDATE auth_sessions SET revoked_at=\?/);
});

test("la manutenzione elimina realmente sessioni e inviti scaduti e ne espone solo i conteggi", () => {
  assert.match(worker, /DELETE FROM auth_sessions WHERE expires_at<=\?/);
  assert.match(worker, /DELETE FROM profile_invites WHERE expires_at<=\? OR used_at IS NOT NULL/);
  assert.match(worker, /auth_sessions_removed: removed\(0\)/);
  assert.match(worker, /profile_invites_removed: removed\(4\)/);
});

test("il rinnovo estende soltanto una sessione ancora valida e prossima alla scadenza", () => {
  assert.match(worker, /request\.method === "POST" && path === "auth\/refresh"[\s\S]*?sessionFromRequest\(request, env\)/);
  assert.match(worker, /UPDATE auth_sessions SET last_used_at=\?,expires_at=\?[\s\S]*?revoked_at IS NULL AND expires_at>\?/);
  assert.match(worker, /const expiresAt = futureIso\(24 \* 30\)/);
  assert.match(client, /expiresAt - Date\.now\(\) < 7 \* 24 \* 60 \* 60 \* 1000[\s\S]*?\/auth\/refresh/);
  assert.doesNotMatch(worker, /path === "auth\/refresh"[\s\S]{0,1200}?return json\(\{[^}]*token/);
});

test("revocare una sessione disattiva anche le notifiche del profilo", () => {
  const revocationDeletes = worker.match(/DELETE FROM push_subscriptions WHERE profile_id=\?/g) || [];
  assert.ok(revocationDeletes.length >= 3, "logout, revoca dispositivo e logout totale devono disattivare le push");
  assert.match(worker, /push_subscriptions_revoked/);
});

test("invito personale e registrazione sono limitati contro gli abusi", () => {
  assert.match(worker, /rateLimit\(env, request, "auth-register", 8, 300\)/);
  assert.match(worker, /rateLimit\(env, request, "auth-claim", 20, 60\)/);
  assert.match(worker, /UPDATE profile_invites SET used_at=\?[\s\S]*?used_at IS NULL/);
  assert.match(worker, /if \(!claim\.meta\?\.changes\)[\s\S]*?Invito già utilizzato/);
  assert.match(worker, /request\.method === "DELETE" && path\.startsWith\("auth\/invites\/"\)/);
  assert.match(worker, /Solo il coordinatore può revocare inviti/);
  assert.match(worker, /DELETE FROM profile_invites WHERE token_hash=\? AND used_at IS NULL/);
});

test("documenti privati sono leggibili solo dal proprietario o coordinatore", () => {
  assert.match(worker, /key\.startsWith\("private\/"\)[\s\S]*?sessionFromRequest\(request, env\)/);
  assert.match(worker, /session\.role !== "coordinator"[\s\S]*?document\.profile_id !== session\.profile_id/);
  assert.match(worker, /Documento non autorizzato/);
});

test("solo il proprietario può caricare o eliminare il proprio documento", () => {
  assert.match(worker, /const ownsDocument = session\?\.profile_id === profileId/);
  assert.match(worker, /coordinatorVerificationOnly[\s\S]*?!requestsFileChange/);
  assert.match(worker, /request\.method === "DELETE"[\s\S]*?session\.profile_id !== profileId[\s\S]*?Documento non autorizzato/);
});

test("la sostituzione concorrente di un documento ordina aggiornamento e pulizia", () => {
  assert.match(worker, /const statements = \[[\s\S]*?SELECT file_key FROM document_status[\s\S]*?ON CONFLICT\(profile_id,doc_type\) DO UPDATE/);
  assert.match(worker, /const \[previousResult\] = await env\.DB\.batch\(statements\)/);
  assert.match(worker, /previous = previousResult\?\.results\?\.\[0\]/);
  assert.match(worker, /previous\?\.file_key && previous\.file_key !== media\.key[\s\S]*?deleteStoredMedia\(env, previous\.file_key\)/);
});

test("la posizione può essere modificata e rimossa soltanto dal proprietario", () => {
  assert.match(worker, /String\(b\.profile_id \|\| ""\) !== session\.profile_id/);
  assert.match(worker, /session\.profile_id !== profileId[\s\S]*?Non puoi cancellare questa posizione/);
  assert.match(worker, /latitude < -90 \|\| latitude > 90/);
  assert.match(worker, /longitude < -180 \|\| longitude > 180/);
});

test("la cancellazione del profilo revoca accessi e rimuove tutti i dati collegati", () => {
  assert.match(worker, /request\.method === "DELETE" && path\.startsWith\("profiles\/"\)/);
  assert.match(worker, /session\.role !== "coordinator" && session\.profile_id !== profileId/);
  assert.match(worker, /Prima assegna un altro coordinatore/);
  for (const table of [
    "post_media", "comments", "reactions", "posts", "document_status", "locations",
    "push_subscriptions", "profile_invites", "auth_sessions", "profile_device_claims",
    "idempotency_operations", "upload_parts", "upload_sessions", "profiles",
  ]) assert.match(worker, new RegExp(`DELETE FROM ${table}`), `pulizia mancante per ${table}`);
  assert.match(worker, /key\.startsWith\("public\/"\)[\s\S]*?if \(!referenced\) return new Response\("Not found", \{ status: 404 \}\)/);
});

test("il gruppo conserva sempre almeno un coordinatore", () => {
  const guards = worker.match(/Prima assegna un altro coordinatore/g) || [];
  assert.ok(guards.length >= 2, "retrocessione ed eliminazione devono proteggere l’ultimo coordinatore");
  assert.match(worker, /current\.role === "coordinator" && updatedRole !== "coordinator"/);
  assert.match(worker, /SELECT id FROM profiles WHERE role='coordinator' AND id<>\? LIMIT 1/);
});

test("upload a parti e cancellazione verificano sempre il proprietario", () => {
  const ownerChecks = worker.match(/upload\.profile_id !== session\.profile_id/g) || [];
  assert.ok(ownerChecks.length >= 4, `controlli proprietario upload trovati: ${ownerChecks.length}`);
  assert.match(worker, /scope === "document"[\s\S]*?80 \* 1024 \* 1024/);
  assert.match(worker, /status='completed'[\s\S]*?consumed_at IS NULL/);
});
