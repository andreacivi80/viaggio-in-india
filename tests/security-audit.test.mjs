import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildSecurityAuditRecord } from "../functions/api/[[path]].js";

test("il registro di sicurezza accetta soltanto campi non sensibili", () => {
  const record = buildSecurityAuditRecord({
    id: "audit-1",
    event_type: "document_opened",
    actor_profile_id: "profile-1",
    actor_role: "traveler",
    device_id: "device-1",
    resource_type: "document",
    resource_id: "profile-1:passport",
    result: "success",
    created_at: "2026-08-06T06:00:00.000Z",
    token: "token-segreto",
    password: "password-segreta",
    document_content: "contenuto completo del passaporto",
    file_name: "passaporto-andrea.pdf",
  });
  assert.deepEqual(Object.keys(record), [
    "id", "event_type", "actor_profile_id", "actor_role", "device_id",
    "resource_type", "resource_id", "result", "created_at",
  ]);
  const serialized = JSON.stringify(record);
  for (const forbidden of ["token-segreto", "password-segreta", "contenuto completo", "passaporto-andrea.pdf"])
    assert.doesNotMatch(serialized, new RegExp(forbidden));
});

test("schema e Worker non prevedono colonne per password token o contenuto", async () => {
  const [schema, migration, worker] = await Promise.all([
    readFile(new URL("../db/schema.sql", import.meta.url), "utf8"),
    readFile(new URL("../db/migrations/0020_security_audit_log.sql", import.meta.url), "utf8"),
    readFile(new URL("../functions/api/[[path]].js", import.meta.url), "utf8"),
  ]);
  for (const sql of [schema, migration]) {
    const table = sql.match(/CREATE TABLE IF NOT EXISTS security_audit_log \(([\s\S]*?)\);/i)?.[1] || "";
    assert.match(table, /event_type/);
    assert.match(table, /device_id/);
    assert.match(table, /created_at/);
    assert.doesNotMatch(table, /password|token|content|file_name/i);
  }
  assert.match(worker, /path === "security\/audit"[\s\S]*?session\.role !== "coordinator"/);
  assert.match(worker, /SELECT id,event_type,actor_profile_id,actor_role,device_id,[\s\S]*?resource_type,resource_id,result,created_at/);
});

test("gli eventi critici richiesti sono registrati con dispositivo e ora server", async () => {
  const worker = await readFile(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");
  for (const event of [
    "access", "device_revoked", "document_opened", "document_uploaded",
    "document_deleted", "document_replaced", "invite_created", "invite_used",
    "logout", "location_shared", "location_deleted", "post_deleted",
    "comment_deleted", "profile_created", "profile_updated", "role_changed",
    "rate_limit_reached",
  ]) assert.ok(worker.includes(`"${event}"`), `evento audit mancante: ${event}`);
  assert.match(worker, /created_at: auditValue\(input\.created_at \|\| now\(\)/);
  assert.match(worker, /device_id: auditValue\(input\.device_id/);
});
