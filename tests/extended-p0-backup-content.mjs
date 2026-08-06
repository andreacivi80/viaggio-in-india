import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const token = process.env.QA_SESSION_TOKEN;
const profileId = process.env.QA_PROFILE_ID;
const persistRoot = process.env.QA_LOCAL_PERSIST_ROOT;
const python = process.env.QA_PYTHON_EXE || "python";
if (!base || !token || !profileId || !persistRoot)
  throw new Error("Ambiente QA backup contenuti incompleto");

const authorization = `Bearer ${token}`;
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
const pdf = new Blob(["%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF"], { type: "application/pdf" });
const createdPosts = [];
const createdDocuments = [];
const directory = await mkdtemp(join(tmpdir(), "india-p0-backup-content-"));
const backup = join(directory, "concurrent-content.sql");

const uploadDocument = async (type, name) => {
  const form = new FormData();
  form.set("profile_id", profileId);
  form.set("doc_type", type);
  form.set("status", "present");
  form.set("file", pdf, name);
  const response = await request("/api/documents", {
    method: "POST",
    headers: { authorization, "x-idempotency-key": crypto.randomUUID() },
    body: form,
  });
  assert.equal(response.status, 200);
  createdDocuments.push(type);
};

const createPost = async (index) => {
  const form = new FormData();
  form.set("visibility", "public");
  form.set("day_index", "-1");
  form.set("text", `Post durante backup ${index} ${crypto.randomUUID()}`);
  const response = await request("/api/posts", {
    method: "POST",
    headers: { authorization, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: form,
  });
  assert.equal(response.status, 201);
  createdPosts.push((await response.json()).id);
};

try {
  const deletedMarker = `NON-RIPRISTINARE-${crypto.randomUUID()}`;
  const deletedForm = new FormData();
  deletedForm.set("visibility", "public");
  deletedForm.set("day_index", "-1");
  deletedForm.set("text", deletedMarker);
  const deletedCreate = await request("/api/posts", {
    method: "POST",
    headers: { authorization, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: deletedForm,
  });
  assert.equal(deletedCreate.status, 201);
  const deletedPostId = (await deletedCreate.json()).id;
  assert.equal((await request(`/api/posts/${deletedPostId}`, {
    method: "DELETE",
    headers: { authorization },
  })).status, 200);

  for (const [type, name] of [
    ["passport", "backup-passaporto.pdf"],
    ["visa", "backup-visto.pdf"],
    ["tickets", "backup-biglietti.pdf"],
    ["insurance", "backup-assicurazione.pdf"],
  ]) await uploadDocument(type, name);

  const exportProcess = spawn(python, [
    "scripts/backup-local-d1.py", persistRoot, backup,
  ], { cwd: process.cwd(), windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  let exportOutput = "";
  exportProcess.stdout.on("data", (chunk) => { exportOutput += chunk; });
  exportProcess.stderr.on("data", (chunk) => { exportOutput += chunk; });
  const exportFinished = new Promise((resolve, reject) => {
    exportProcess.once("error", reject);
    exportProcess.once("close", resolve);
  });

  await Promise.all([
    ...Array.from({ length: 5 }, (_, index) => createPost(index + 1)),
    ...Array.from({ length: 3 }, (_, index) =>
      uploadDocument(`other-${crypto.randomUUID()}`, `backup-extra-${index + 1}.pdf`)),
  ]);

  const exportCode = await exportFinished;
  assert.equal(exportCode, 0, exportOutput);
  assert.ok((await stat(backup)).size > 10_000);

  const verify = spawn(python, ["scripts/verify-d1-backup.py", backup], {
    cwd: process.cwd(), windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  });
  let verifyOutput = "";
  verify.stdout.on("data", (chunk) => { verifyOutput += chunk; });
  verify.stderr.on("data", (chunk) => { verifyOutput += chunk; });
  const verifyCode = await new Promise((resolve, reject) => {
    verify.once("error", reject);
    verify.once("close", resolve);
  });
  assert.equal(verifyCode, 0, verifyOutput);
  assert.match(verifyOutput, /BACKUP_OK/);
  const restoredDocuments = JSON.parse(verifyOutput.match(/^DOCUMENTI (.+)$/m)?.[1] || "[]")
    .filter((document) => document.profile_id === profileId);
  const restoredPosts = JSON.parse(verifyOutput.match(/^POSTS (.+)$/m)?.[1] || "[]");
  assert.ok(restoredDocuments.length >= 4, `documenti nel backup: ${restoredDocuments.length}`);

  for (const document of restoredDocuments) {
    const response = await request(`/api/media/${encodeURIComponent(document.file_key)}`, {
      headers: { authorization },
    });
    assert.equal(response.status, 200, document.file_name);
    assert.match(response.headers.get("content-type") || "", /application\/pdf/i);
    assert.ok((await response.arrayBuffer()).byteLength > 20);
  }

  const state = await (await request("/api/state", { headers: { authorization } })).json();
  for (const postId of createdPosts)
    assert.ok(state.posts.some((post) => post.id === postId), postId);
  assert.equal(new Set(createdPosts).size, 5);
  const backupSql = await readFile(backup, "utf8");
  assert.ok(backupSql.includes("CREATE TABLE"));
  assert.equal(restoredPosts.some((post) => post.text === deletedMarker), false);
  assert.equal(restoredPosts.some((post) => post.id === deletedPostId), false);
  console.log(`P0_BACKUP_CONTENT=${restoredDocuments.length + 19}/${restoredDocuments.length + 19}`);
} finally {
  for (const postId of createdPosts)
    await request(`/api/posts/${postId}`, { method: "DELETE", headers: { authorization } }).catch(() => {});
  for (const type of createdDocuments)
    await request(`/api/documents/${profileId}/${type}`, { method: "DELETE", headers: { authorization } }).catch(() => {});
  await rm(directory, { recursive: true, force: true });
}
