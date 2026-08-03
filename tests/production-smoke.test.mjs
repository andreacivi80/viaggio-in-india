import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = (process.env.TEST_BASE_URL || "https://viaggio-in-india-2026.pages.dev").replace(/\/$/, "");
const packageData = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));

async function request(path, options = {}) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await fetch(`${base}${path}`, options);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

test("dominio, revisione, mappa e Service Worker sono coerenti", async () => {
  const page = await request(`/?qa=${packageData.version}`, { cache: "no-store" });
  assert.equal(page.status, 200);
  assert.equal(page.headers.get("x-content-type-options"), "nosniff");
  assert.match(page.headers.get("content-security-policy") || "", /default-src 'self'/);
  const html = await page.text();
  const asset = html.match(/src="([^"]+\.js)"/)?.[1];
  assert.ok(asset, "bundle JavaScript non trovato");
  const bundle = await (await request(asset, { cache: "no-store" })).text();
  assert.match(bundle, new RegExp(packageData.version.replaceAll(".", "\\.")));
  assert.match(bundle, /tiles\.openfreemap\.org\/styles\/liberty/);
  assert.doesNotMatch(bundle, /192\.168\./);
  assert.doesNotMatch(bundle, /india26/i);
  const worker = await (await request("/sw.js", { cache: "no-store" })).text();
  assert.match(worker, new RegExp(packageData.version.replaceAll(".", "\\.")));
});

test("stato pubblico non espone campi privati dei profili", async () => {
  const response = await request("/api/state", { cache: "no-store" });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const state = await response.json();
  assert.ok(Array.isArray(state.profiles));
  for (const profile of state.profiles) {
    for (const privateField of ["age", "job", "bio", "avatar_key"])
      assert.equal(privateField in profile, false, `${privateField} esposto al pubblico`);
  }
});

test("documenti e posizioni private sono negate al pubblico", async () => {
  assert.equal((await request("/api/private", { cache: "no-store" })).status, 401);
  assert.equal(
    (await request("/api/locations/profilo-non-autorizzato", { method: "DELETE" })).status,
    403,
  );
});

test("commenti e reazioni richiedono un'identità server", async () => {
  const postId = "post-inesistente-collaudo-autorizzazioni";
  const comment = new FormData();
  comment.set("post_id", postId);
  comment.set("author_name", "Nome modificato dal browser");
  comment.set("visitor_id", "id-modificato");
  comment.set("text", "tentativo non autorizzato");
  assert.equal((await request("/api/comments", { method: "POST", body: comment })).status, 401);
  assert.equal(
    (await request("/api/reactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ post_id: postId, visitor_id: "id-modificato", author_name: "Nome modificato", kind: "heart" }),
    })).status,
    401,
  );
});

test("identità ospite valida e richieste vuote sono gestite senza scritture", async () => {
  const guestResponse = await request("/api/auth/guest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ display_name: "Collaudo automatico" }),
  });
  assert.equal(guestResponse.status, 201);
  const guest = await guestResponse.json();
  assert.ok(guest.token && guest.visitor_id);
  const state = await (await request("/api/state", { cache: "no-store" })).json();
  const empty = new FormData();
  empty.set("post_id", state.posts[0].id);
  const emptyResponse = await request("/api/comments", {
    method: "POST",
    headers: { "x-guest-token": guest.token },
    body: empty,
  });
  assert.equal(emptyResponse.status, 400);
});

test("health API risponde e non usa il computer locale", async () => {
  const response = await request("/api/health", { cache: "no-store" });
  assert.equal(response.status, 200);
  const health = await response.json();
  assert.equal(health.ok, true);
  assert.equal(Number.isFinite(Number(health.version)), true);
});

test("rate limiting blocca una raffica di accessi errati", { skip: process.env.RUN_ABUSE !== "true" }, async () => {
  const statuses = [];
  for (let index = 0; index < 12; index += 1) {
    const response = await request("/api/auth/group", {
      method: "POST",
      headers: { "x-group-code": `codice-errato-${Date.now()}-${index}` },
    });
    statuses.push(response.status);
  }
  assert.ok(statuses.includes(429), `nessun 429: ${statuses.join(",")}`);
});
