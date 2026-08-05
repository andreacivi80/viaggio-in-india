import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const authorization = `Bearer ${process.env.QA_SESSION_TOKEN}`;
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
if (!base || !process.env.QA_SESSION_TOKEN) throw new Error("Ambiente QA backup/commenti incompleto");

const postForm = new FormData();
postForm.set("visibility", "public");
postForm.set("day_index", "-1");
postForm.set("text", `P0 backup commenti ${crypto.randomUUID()}`);
const postResponse = await request("/api/posts", {
  method: "POST",
  headers: { authorization, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
  body: postForm,
});
assert.equal(postResponse.status, 201);
const post = await postResponse.json();
const directory = await mkdtemp(join(tmpdir(), "india-p0-backup-"));
const backup = join(directory, "qa-concurrent-comments.sql");

const exportProcess = spawn("npx", [
  "wrangler", "d1", "export", "viaggio-in-india-qa-db", "--remote",
  "--config", "wrangler.qa.jsonc", "--output", backup,
], { cwd: process.cwd(), windowsHide: true, shell: true, stdio: ["ignore", "pipe", "pipe"] });
let exportOutput = "";
exportProcess.stdout.on("data", (chunk) => { exportOutput += chunk; });
exportProcess.stderr.on("data", (chunk) => { exportOutput += chunk; });

try {
  for (let index = 0; index < 8; index += 1) {
    const form = new FormData();
    form.set("post_id", post.id);
    form.set("text", `Commento concorrente ${index + 1}`);
    const response = await request("/api/comments", {
      method: "POST",
      headers: { authorization, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
      body: form,
    });
    assert.equal(response.status, 201);
  }
  const exportCode = await new Promise((resolve, reject) => {
    exportProcess.once("error", reject);
    exportProcess.once("close", resolve);
  });
  assert.equal(exportCode, 0, exportOutput);
  assert.ok((await stat(backup)).size > 10_000);
  const sql = await readFile(backup, "utf8");
  assert.match(sql, /CREATE TABLE (?:IF NOT EXISTS )?comments/i);
  const state = await (await request("/api/state", { headers: { authorization } })).json();
  const livePost = state.posts.find((item) => item.id === post.id);
  assert.equal(livePost?.comments?.length, 8);
  console.log("P0_BACKUP_COMMENTS=12/12");
} finally {
  await request(`/api/posts/${post.id}`, { method: "DELETE", headers: { authorization } });
  if (exportProcess.exitCode === null) exportProcess.kill();
  await rm(directory, { recursive: true, force: true });
}
