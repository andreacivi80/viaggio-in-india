import assert from "node:assert/strict";

const base = process.env.API_BASE_URL || "http://127.0.0.1:8788";
const checks = [];
async function check(name, run) {
  try {
    await run();
    checks.push({ name, status: "PASS" });
    console.log(`PASS ${checks.length} ${name}`);
  } catch (error) {
    checks.push({ name, status: "FAIL", error: error.message });
    console.error(`FAIL ${checks.length} ${name}: ${error.message}`);
  }
}
async function request(path, options = {}) {
  const response = await fetch(`${base}/api/${path}`, options);
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

let coordinatorToken = "";
let postId = "";
let guestToken = "";

await check("health remoto", async () => {
  const { response, body } = await request("health");
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
});

await check("password errata bloccata", async () => {
  const { response } = await request("auth/group", { method: "POST", headers: { "x-group-code": "errata" } });
  assert.equal(response.status, 403);
});

await check("password corretta verificata", async () => {
  const { response, body } = await request("auth/group", { method: "POST", headers: { "x-group-code": "india26" } });
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
});

await check("profilo senza sessione bloccato", async () => {
  const form = new FormData();
  form.set("name", "Intruso");
  const { response } = await request("profiles", { method: "POST", body: form });
  assert.equal(response.status, 403);
});

await check("creazione primo coordinatore", async () => {
  const { response, body } = await request("auth/bootstrap", {
    method: "POST",
    headers: { "content-type": "application/json", "x-group-code": "india26", "x-device-name": "GitHub QA" },
    body: JSON.stringify({ name: "Coordinatore", surname: "QA", origin_city: "Test" }),
  });
  assert.equal(response.status, 201);
  assert.ok(body.token);
  assert.equal(body.profile.role, "coordinator");
  coordinatorToken = body.token;
});

await check("secondo bootstrap impedito", async () => {
  const { response } = await request("auth/bootstrap", {
    method: "POST",
    headers: { "content-type": "application/json", "x-group-code": "india26" },
    body: JSON.stringify({ name: "Secondo" }),
  });
  assert.equal(response.status, 409);
});

await check("sessione coordinatore valida", async () => {
  const { response, body } = await request("auth/session", { headers: { authorization: `Bearer ${coordinatorToken}` } });
  assert.equal(response.status, 200);
  assert.equal(body.profile.role, "coordinator");
});

await check("coordinatore crea viaggiatore", async () => {
  const form = new FormData();
  form.set("name", "Viaggiatore");
  form.set("surname", "QA");
  form.set("role", "traveler");
  const { response, body } = await request("profiles", {
    method: "POST",
    headers: { authorization: `Bearer ${coordinatorToken}` },
    body: form,
  });
  assert.equal(response.status, 201);
  assert.equal(body.role, "traveler");
});

await check("pubblicazione senza sessione bloccata", async () => {
  const form = new FormData();
  form.set("text", "Non autorizzato");
  const { response } = await request("posts", { method: "POST", body: form });
  assert.equal(response.status, 403);
});

await check("coordinatore pubblica contenuto", async () => {
  const form = new FormData();
  form.set("text", "Ricordo QA");
  form.set("visibility", "public");
  form.set("day_index", "0");
  const { response, body } = await request("posts", {
    method: "POST",
    headers: { authorization: `Bearer ${coordinatorToken}`, "x-idempotency-key": "qa-post-operation-0001", "x-qa-silent": "true" },
    body: form,
  });
  assert.equal(response.status, 201);
  assert.ok(body.id);
  postId = body.id;
});

await check("visitatore ottiene identità ospite", async () => {
  const { response, body } = await request("auth/guest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ display_name: "Familiare QA" }),
  });
  assert.equal(response.status, 201);
  assert.ok(body.token);
  guestToken = body.token;
});

await check("visitatore commenta contenuto pubblico", async () => {
  const form = new FormData();
  form.set("post_id", postId);
  form.set("text", "Commento QA");
  const { response, body } = await request("comments", {
    method: "POST",
    headers: { "x-guest-token": guestToken, "x-idempotency-key": "qa-comment-operation-0001", "x-qa-silent": "true" },
    body: form,
  });
  assert.equal(response.status, 201);
  assert.equal(body.author_name, "Familiare QA");
});

await check("visitatore non elimina il post", async () => {
  const { response } = await request(`posts/${postId}`, { method: "DELETE", headers: { "x-guest-token": guestToken } });
  assert.equal(response.status, 403);
});

await check("coordinatore elimina il post", async () => {
  const { response, body } = await request(`posts/${postId}`, { method: "DELETE", headers: { authorization: `Bearer ${coordinatorToken}` } });
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
});

await check("logout revoca sessione", async () => {
  const logout = await request("auth/logout", { method: "POST", headers: { authorization: `Bearer ${coordinatorToken}` } });
  assert.equal(logout.response.status, 200);
  const session = await request("auth/session", { headers: { authorization: `Bearer ${coordinatorToken}` } });
  assert.equal(session.response.status, 401);
});

const passed = checks.filter((item) => item.status === "PASS").length;
console.log("LOCAL PAGES API GATE RESULT", JSON.stringify({ passed, total: checks.length, checks }));
if (passed !== checks.length) process.exitCode = 1;
