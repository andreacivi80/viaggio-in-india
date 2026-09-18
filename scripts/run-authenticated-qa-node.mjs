import { createHash, randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const qaGroupCodePath = join(root, ".wrangler", "qa-group-code.txt");
const qaGroupCode = existsSync(qaGroupCodePath) ? readFileSync(qaGroupCodePath, "utf8").trim() : "";
const option = (name, fallback = "") => process.argv.find((item) => item.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback;
const baseUrl = option("base-url", "https://viaggio-in-india-2026-qa.pages.dev").replace(/\/$/, "");
const testFiles = option("test").split(",").filter(Boolean);
const pushMemberCount = Number(option("push-members", "0"));
if (!/^https:\/\/([a-z0-9-]+\.)?viaggio-in-india-2026-qa\.pages\.dev$/i.test(baseUrl))
  throw new Error("Protezione dati: i test scriventi possono usare soltanto QA");
if (!testFiles.length || testFiles.some((file) => !/^[a-z0-9._-]+\.mjs$/i.test(file)))
  throw new Error("Specificare --test=<file.mjs>[,<file.mjs>]");
const testSources = new Map(testFiles.map((file) => {
  const path = join(root, "tests", file);
  if (!existsSync(path)) throw new Error(`Test QA inesistente: ${file}`);
  return [file, readFileSync(path, "utf8")];
}));
if (testFiles.filter((file) => file.endsWith(".spec.mjs")).length > 1)
  throw new Error("Ogni suite UI deve usare profili e inviti QA nuovi: eseguire un solo file per volta");
if (![0, 18].includes(pushMemberCount)) throw new Error("--push-members può essere soltanto 18");

const runId = randomUUID().replaceAll("-", "");
const created = new Date().toISOString();
const expires = new Date(Date.now() + 30 * 86400000).toISOString();
const oldLastUse = new Date(Date.now() - 30 * 86400000).toISOString();
const value = (prefix) => `${prefix}-${runId}`;
const token = () => randomBytes(32).toString("hex");
const digest = (input) => createHash("sha256").update(input).digest("hex");
const profiles = {
  owner: value("qa-owner"), other: value("qa-other"), coordinator: value("qa-coordinator"),
  unclaimed: value("qa-unclaimed"), deleting: value("qa-delete"),
};
const tokens = {
  owner: token(), other: token(), coordinator: token(), coordinatorSecond: token(),
  expired: token(), secondary: token(), deleting: token(),
  invite: token(), switchInvite: token(), coordinatorInvite: token(),
};
const deviceKeys = {
  owner: "1".repeat(64), other: "2".repeat(64), coordinator: "3".repeat(64),
  coordinatorSecond: "4".repeat(64), expired: "5".repeat(64), secondary: "6".repeat(64), deleting: "7".repeat(64),
};
const ids = Object.values(profiles);
const pushMembers = [];
const managedProfileName = `Gestito QA ${runId.slice(0, 8)}`;

function sql(valueToQuote) { return `'${String(valueToQuote).replaceAll("'", "''")}'`; }
function profileInsert(id, name, role = "traveler") {
  return `INSERT INTO profiles(id,name,surname,role,created_at) VALUES(${sql(id)},${sql(name)},'QA',${sql(role)},${sql(created)});`;
}
function sessionInsert(profileId, sessionToken, deviceId, name, deviceKey, lastUsed = created) {
  return `INSERT INTO auth_sessions(token_hash,profile_id,device_id,device_name,device_key_hash,created_at,last_used_at,expires_at,revoked_at) VALUES(${sql(digest(sessionToken))},${sql(profileId)},${sql(deviceId)},${sql(name)},${sql(digest(deviceKey))},${sql(lastUsed)},${sql(lastUsed)},${sql(expires)},NULL);`;
}
let pushSql = "";
for (let index = 1; index <= pushMemberCount; index += 1) {
  const member = { id: value(`qa-push-${index}`), token: token(), deviceKey: `${index.toString(16)}`.padStart(64, "a") };
  pushMembers.push(member);
  ids.push(member.id);
  pushSql += `${profileInsert(member.id, `Notifiche ${index}`)}\n${sessionInsert(member.id, member.token, value(`device-push-${index}`), `Telefono notifiche ${index}`, member.deviceKey)}\n`;
}
const referencePostId = value("qa-reference");
const commentPaginationFixtures = testFiles.some((file) => [
  "ui-comment-pagination.spec.mjs",
  "extended-p2-comment-pagination-large.mjs",
].includes(file))
  ? Array.from({ length: 60 }, (_, index) => {
      const commentId = value(`qa-page-comment-${String(index + 1).padStart(2, "0")}`);
      const text = index === 4 ? `Bersaglio Bangkok ${runId}` : `Commento pagina ${index + 1}`;
      const timestamp = new Date(Date.parse(created) + index * 1000).toISOString();
      return `INSERT INTO comments(id,post_id,author_name,profile_id,visitor_id,text,media_key,media_type,parent_comment_id,created_at) VALUES(${sql(commentId)},${sql(referencePostId)},'Proprietario QA',${sql(profiles.owner)},'',${sql(text)},NULL,NULL,'',${sql(timestamp)});`;
    }).join("\n")
  : "";
const socialScaleFixtures = testFiles.includes("extended-p2-social-scale.mjs")
  ? [
      ...Array.from({ length: 10 }, (_, batch) => {
        const offset = batch * 1000;
        return `WITH RECURSIVE cnt(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM cnt WHERE x<1000)
INSERT INTO comments(id,post_id,author_name,profile_id,visitor_id,text,media_key,media_type,parent_comment_id,created_at)
SELECT printf('qa-scale-comment-${runId}-%05d',${offset}+x),${sql(referencePostId)},'Carico QA',${sql(profiles.owner)},'',printf('Commento di carico %05d',${offset}+x),NULL,NULL,'',datetime('2026-08-10','+'||(${offset}+x)||' seconds') FROM cnt;`;
      }),
      ...Array.from({ length: 20 }, (_, batch) => {
        const offset = batch * 1000;
        return `WITH RECURSIVE cnt(x) AS (VALUES(1) UNION ALL SELECT x+1 FROM cnt WHERE x<1000)
INSERT INTO reactions(id,post_id,visitor_id,author_name,kind,created_at)
SELECT printf('qa-scale-reaction-${runId}-%05d',${offset}+x),${sql(referencePostId)},printf('qa-scale-visitor-${runId}-%05d',${offset}+x),printf('Reazione %05d',${offset}+x),'heart',datetime('2026-08-10','+'||(${offset}+x)||' seconds') FROM cnt;`;
      }),
    ].join("\n")
  : "";
const retentionFixtures = testFiles.includes("extended-p0-location-retention.mjs") ? `
INSERT INTO locations(profile_id,display_name,latitude,longitude,accuracy,updated_at) VALUES(${sql(profiles.owner)},'Posizione scaduta QA',28.6139,77.209,50,${sql(new Date(Date.now() - 48 * 86400000).toISOString())});
INSERT INTO locations(profile_id,display_name,latitude,longitude,accuracy,updated_at) VALUES(${sql(profiles.other)},'Posizione recente QA',13.7563,100.5018,50,${sql(created)});` : "";
const locationAgeFixtures = testFiles.includes("ui-location-age-labels.spec.mjs") ? `
INSERT INTO locations(profile_id,display_name,latitude,longitude,accuracy,updated_at) VALUES(${sql(profiles.owner)},'Posizione recente QA',13.7563,100.5018,25,${sql(new Date(Date.now() - 5 * 60000).toISOString())});
INSERT INTO locations(profile_id,display_name,latitude,longitude,accuracy,updated_at) VALUES(${sql(profiles.other)},'Posizione vecchia QA',13.7463,100.5118,50,${sql(new Date(Date.now() - 2 * 3600000).toISOString())});
INSERT INTO locations(profile_id,display_name,latitude,longitude,accuracy,updated_at) VALUES(${sql(profiles.coordinator)},'Posizione scaduta QA',13.7363,100.5218,75,${sql(new Date(Date.now() - 18 * 3600000).toISOString())});` : "";
const mediaCapUploadIds = [value("qa-media-cap-a"), value("qa-media-cap-b")];
const mediaCapFixtures = testFiles.includes("extended-p3-media-post-cap.mjs") ? `
INSERT INTO upload_sessions(id,profile_id,upload_id,object_key,scope,visibility,content_type,file_name,file_size,status,created_at,expires_at,completed_at)
VALUES(${sql(mediaCapUploadIds[0])},${sql(profiles.owner)},${sql(mediaCapUploadIds[0])},${sql(`chunked/public/${mediaCapUploadIds[0]}.mp4`)},'post','public','video/mp4','cap-a.mp4',325058560,'completed',${sql(created)},${sql(expires)},${sql(created)});
INSERT INTO upload_sessions(id,profile_id,upload_id,object_key,scope,visibility,content_type,file_name,file_size,status,created_at,expires_at,completed_at)
VALUES(${sql(mediaCapUploadIds[1])},${sql(profiles.owner)},${sql(mediaCapUploadIds[1])},${sql(`chunked/public/${mediaCapUploadIds[1]}.mp4`)},'post','public','video/mp4','cap-b.mp4',325058560,'completed',${sql(created)},${sql(expires)},${sql(created)});` : "";
const setup = `
UPDATE profiles SET role='traveler' WHERE role='coordinator' AND id LIKE 'qa-%';
${profileInsert(profiles.owner, "Proprietario")}
${profileInsert(profiles.other, "Secondo")}
${profileInsert(profiles.coordinator, "Coordinatore", "coordinator")}
${profileInsert(profiles.unclaimed, "Invitato")}
${profileInsert(profiles.deleting, "Da eliminare")}
${sessionInsert(profiles.owner, tokens.owner, value("device-owner"), "Telefono proprietario QA", deviceKeys.owner)}
${sessionInsert(profiles.owner, tokens.secondary, value("device-owner-secondary"), "Secondo telefono proprietario QA", deviceKeys.secondary)}
${sessionInsert(profiles.other, tokens.other, value("device-other"), "Secondo telefono QA", deviceKeys.other)}
${sessionInsert(profiles.coordinator, tokens.coordinator, value("device-coordinator"), "Telefono coordinatore QA", deviceKeys.coordinator)}
${sessionInsert(profiles.coordinator, tokens.coordinatorSecond, value("device-coordinator-secondary"), "Secondo telefono coordinatore QA", deviceKeys.coordinatorSecond)}
${sessionInsert(profiles.deleting, tokens.deleting, value("device-delete"), "Telefono profilo da eliminare QA", deviceKeys.deleting)}
${sessionInsert(profiles.owner, tokens.expired, value("device-expired"), "Sessione inattiva QA", deviceKeys.expired, oldLastUse)}
INSERT INTO profile_invites(token_hash,profile_id,created_by,created_at,expires_at,used_at) VALUES(${sql(digest(tokens.invite))},${sql(profiles.owner)},${sql(profiles.coordinator)},${sql(created)},${sql(expires)},NULL);
INSERT INTO profile_invites(token_hash,profile_id,created_by,created_at,expires_at,used_at) VALUES(${sql(digest(tokens.switchInvite))},${sql(profiles.owner)},${sql(profiles.coordinator)},${sql(created)},${sql(expires)},NULL);
INSERT INTO profile_invites(token_hash,profile_id,created_by,created_at,expires_at,used_at) VALUES(${sql(digest(tokens.coordinatorInvite))},${sql(profiles.coordinator)},${sql(profiles.coordinator)},${sql(created)},${sql(expires)},NULL);
INSERT INTO posts(id,author_name,profile_id,day_index,visibility,text,created_at) VALUES(${sql(referencePostId)},'Proprietario QA',${sql(profiles.owner)},-1,'public',${sql(`Pubblicazione di riferimento QA ${runId}`)},${sql(created)});
${commentPaginationFixtures}
${socialScaleFixtures}
${pushSql}
${retentionFixtures}
${locationAgeFixtures}
${mediaCapFixtures}`;
const quotedIds = ids.map(sql).join(",");
const quotedActors = ids.map((id) => sql(`profile:${id}`)).join(",");
const cleanup = `
DELETE FROM comment_reactions WHERE actor_id IN (${quotedActors}) OR comment_id IN (SELECT id FROM comments WHERE profile_id IN (${quotedIds}));
DELETE FROM comments WHERE profile_id IN (${quotedIds});
DELETE FROM reactions WHERE visitor_id IN (${quotedIds}) OR post_id IN (SELECT id FROM posts WHERE profile_id IN (${quotedIds}));
DELETE FROM trip_checks WHERE updated_by IN (${quotedIds});
DELETE FROM post_media WHERE post_id IN (SELECT id FROM posts WHERE profile_id IN (${quotedIds}));
DELETE FROM posts WHERE profile_id IN (${quotedIds});
DELETE FROM document_status WHERE profile_id IN (${quotedIds});
DELETE FROM locations WHERE profile_id IN (${quotedIds});
DELETE FROM upload_parts WHERE upload_session_id IN (SELECT id FROM upload_sessions WHERE profile_id IN (${quotedIds}));
DELETE FROM upload_sessions WHERE profile_id IN (${quotedIds});
DELETE FROM profile_invites WHERE profile_id IN (${quotedIds}) OR created_by IN (${quotedIds});
DELETE FROM push_subscriptions WHERE profile_id IN (${quotedIds});
DELETE FROM notification_preferences WHERE profile_id IN (${quotedIds});
DELETE FROM retention_extensions WHERE profile_id IN (${quotedIds}) OR approved_by IN (${quotedIds});
DELETE FROM auth_sessions WHERE profile_id IN (${quotedIds});
DELETE FROM profile_device_claims WHERE profile_id IN (${quotedIds});
DELETE FROM security_audit_log WHERE actor_profile_id IN (${quotedIds});
DELETE FROM security_audit_log WHERE actor_profile_id IN (SELECT id FROM profiles WHERE name=${sql(managedProfileName)});
DELETE FROM profile_invites WHERE profile_id IN (SELECT id FROM profiles WHERE name=${sql(managedProfileName)}) OR created_by IN (SELECT id FROM profiles WHERE name=${sql(managedProfileName)});
DELETE FROM auth_sessions WHERE profile_id IN (SELECT id FROM profiles WHERE name=${sql(managedProfileName)});
DELETE FROM profile_device_claims WHERE profile_id IN (SELECT id FROM profiles WHERE name=${sql(managedProfileName)});
DELETE FROM profiles WHERE name=${sql(managedProfileName)};
DELETE FROM guest_sessions WHERE display_name LIKE ${sql(`%${runId}%`)};
DELETE FROM profiles WHERE id IN (${quotedIds});`;
const temporaryDirectory = join(root, "artifacts", "qa-node", runId);
mkdirSync(temporaryDirectory, { recursive: true });
const setupPath = join(temporaryDirectory, "setup.sql");
const cleanupPath = join(temporaryDirectory, "cleanup.sql");
writeFileSync(setupPath, setup, "utf8");
writeFileSync(cleanupPath, cleanup, "utf8");

function executeNode(file, args, environment = process.env) {
  const result = spawnSync(process.execPath, [file, ...args], {
    cwd: root, encoding: "utf8", windowsHide: true, shell: false,
    env: environment, maxBuffer: 32 * 1024 * 1024,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${file} non riuscito (${result.status})`);
}
const npxCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js");
const d1File = (path) => {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      executeNode(npxCli, ["--yes", "wrangler@4.118.0", "d1", "execute", "viaggio-in-india-qa-db", "--remote", "--config", "wrangler.qa.jsonc", "--file", path]);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) console.error(`D1_RETRY=${attempt + 1}/3`);
    }
  }
  throw lastError;
};

const waitForQaDatabase = async (url, tokenValue, deviceKey, profileId) => {
  let consecutiveReady = 0;
  let lastStatus = 0;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response = await fetch(`${url}/api/state`, {
        cache: "no-store",
        headers: { authorization: `Bearer ${tokenValue}`, "x-device-key": deviceKey },
      });
      lastStatus = response.status;
      const state = response.status === 200 ? await response.json().catch(() => null) : null;
      const authenticatedProfileVisible = state?.profiles?.some((profile) => profile.id === profileId);
      consecutiveReady = authenticatedProfileVisible ? consecutiveReady + 1 : 0;
      if (consecutiveReady >= 2) return;
    } catch {
      consecutiveReady = 0;
    }
    await new Promise((resolve) => setTimeout(resolve, Math.min(500 + attempt * 250, 2500)));
  }
  throw new Error(`Database QA non stabile prima dei test (ultimo stato ${lastStatus || "rete"})`);
};

let succeeded = false;
try {
  d1File(setupPath);
  const environment = {
    ...process.env,
    TEST_BASE_URL: baseUrl,
    QA_SESSION_TOKEN: tokens.owner, QA_PROFILE_ID: profiles.owner,
    QA_SECOND_SESSION_TOKEN: tokens.other, QA_SECOND_PROFILE_ID: profiles.other,
    QA_COORDINATOR_TOKEN: tokens.coordinator, QA_COORDINATOR_PROFILE_ID: profiles.coordinator,
    QA_COORDINATOR_SECOND_TOKEN: tokens.coordinatorSecond,
    QA_COORDINATOR_SECOND_DEVICE_ID: value("device-coordinator-secondary"),
    QA_UNCLAIMED_PROFILE_ID: profiles.unclaimed, QA_EXPIRED_SESSION_TOKEN: tokens.expired,
    QA_SECOND_DEVICE_ID: value("device-owner-secondary"), QA_SECOND_DEVICE_TOKEN: tokens.secondary,
    QA_OTHER_DEVICE_ID: value("device-other"),
    QA_RUN_ID: runId, QA_REFERENCE_POST_ID: referencePostId,
    QA_MEDIA_CAP_UPLOAD_IDS: JSON.stringify(mediaCapUploadIds),
    QA_DELETE_PROFILE_ID: profiles.deleting, QA_DELETE_PROFILE_TOKEN: tokens.deleting,
    QA_OWNER_DEVICE_KEY: deviceKeys.owner, QA_OTHER_DEVICE_KEY: deviceKeys.other,
    QA_COORDINATOR_DEVICE_KEY: deviceKeys.coordinator,
    QA_COORDINATOR_SECOND_DEVICE_KEY: deviceKeys.coordinatorSecond,
    QA_EXPIRED_DEVICE_KEY: deviceKeys.expired, QA_SECOND_DEVICE_KEY: deviceKeys.secondary,
    QA_DELETE_PROFILE_DEVICE_KEY: deviceKeys.deleting,
    QA_PUSH_MEMBERS: JSON.stringify(pushMembers),
    ...(qaGroupCode ? { QA_GROUP_CODE: qaGroupCode } : {}),
  };
  const uiEnvironment = {
    ...environment,
    QA_UI_SESSION_TOKEN: tokens.owner,
    QA_UI_PROFILE_ID: profiles.owner,
    QA_UI_PROFILE_NAME: "Proprietario QA",
    QA_UI_DEVICE_KEY: deviceKeys.owner,
    QA_UI_INVITE_TOKEN: tokens.invite,
    QA_UI_SWITCH_INVITE_TOKEN: tokens.switchInvite,
    QA_UI_COORDINATOR_NAME: "Coordinatore QA",
    QA_UI_COORDINATOR_INVITE_TOKEN: tokens.coordinatorInvite,
    QA_UI_MANAGED_PROFILE_NAME: managedProfileName,
    QA_UI_EXPIRED_SESSION_TOKEN: tokens.expired,
    QA_UI_ALLOW_REGISTRATION: "true",
    ...(qaGroupCode ? { QA_UI_GROUP_CODE: qaGroupCode } : {}),
  };
  await waitForQaDatabase(baseUrl, tokens.owner, deviceKeys.owner, profiles.owner);
  for (const testFile of testFiles) {
    if (testFile.endsWith(".spec.mjs")) {
      const testSource = testSources.get(testFile);
      const requiredUiVariables = [...new Set(testSource.match(/QA_UI_[A-Z0-9_]+/g) || [])]
        .filter((name) => name !== "QA_UI_GROUP_CODE");
      const missing = requiredUiVariables.filter((name) => !uiEnvironment[name]);
      if (missing.length) throw new Error(`${testFile}: configurazione QA incompleta (${missing.join(", ")})`);
      executeNode(npxCli, ["playwright", "test", `tests/${testFile}`, "--reporter=line"], uiEnvironment);
    } else
      executeNode(join(root, "tests", testFile), [], environment);
  }
  succeeded = true;
} finally {
  d1File(cleanupPath);
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
if (succeeded) console.log(`QA_NODE_COMPLETE=${testFiles.join(",")}`);
