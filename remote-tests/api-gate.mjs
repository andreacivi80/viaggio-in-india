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
let coordinatorId = "";
let travelerId = "";
let travelerToken = "";
let travelerInvite = "";
let travelerDocumentKey = "";
let postId = "";
let commentId = "";
let guestToken = "";
let secondGuestToken = "";

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
  coordinatorId = body.profile.id;
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
  travelerId = body.id;
});

await check("coordinatore crea invito personale", async () => {
  const { response, body } = await request("auth/invites", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${coordinatorToken}` },
    body: JSON.stringify({ profile_id: travelerId }),
  });
  assert.equal(response.status, 201);
  assert.ok(body.invite_token);
  travelerInvite = body.invite_token;
});

await check("viaggiatore attiva invito personale", async () => {
  const { response, body } = await request("auth/claim", {
    method: "POST",
    headers: { "content-type": "application/json", "x-device-name": "Telefono viaggiatore QA" },
    body: JSON.stringify({ invite_token: travelerInvite }),
  });
  assert.equal(response.status, 200);
  assert.equal(body.profile.id, travelerId);
  travelerToken = body.token;
});

await check("invito personale non è riutilizzabile", async () => {
  const { response } = await request("auth/claim", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ invite_token: travelerInvite }),
  });
  assert.equal(response.status, 403);
});

await check("area privata senza sessione bloccata", async () => {
  const { response } = await request("private");
  assert.equal(response.status, 401);
});

await check("viaggiatore carica il proprio passaporto", async () => {
  const form = new FormData();
  form.set("profile_id", travelerId);
  form.set("doc_type", "passport");
  form.set("file", new Blob(["%PDF-1.4\nQA\n%%EOF"], { type: "application/pdf" }), "passaporto-qa.pdf");
  const { response } = await request("documents", {
    method: "POST",
    headers: { authorization: `Bearer ${travelerToken}`, "x-idempotency-key": "qa-document-operation-0001" },
    body: form,
  });
  assert.equal(response.status, 200);
});

await check("viaggiatore non modifica documenti altrui", async () => {
  const form = new FormData();
  form.set("profile_id", coordinatorId);
  form.set("doc_type", "visa");
  form.set("status", "uploaded");
  const { response } = await request("documents", {
    method: "POST",
    headers: { authorization: `Bearer ${travelerToken}` },
    body: form,
  });
  assert.equal(response.status, 403);
});

await check("viaggiatore vede solo i propri documenti", async () => {
  const { response, body } = await request("private", { headers: { authorization: `Bearer ${travelerToken}` } });
  assert.equal(response.status, 200);
  assert.equal(body.viewer.profile_id, travelerId);
  assert.equal(body.documents.length, 1);
  assert.equal(body.documents[0].profile_id, travelerId);
  travelerDocumentKey = body.documents[0].file_key;
});

await check("pubblico non apre il passaporto", async () => {
  const { response } = await request(`media/${encodeURIComponent(travelerDocumentKey)}`);
  assert.equal(response.status, 403);
});

await check("viaggiatore apre il proprio passaporto", async () => {
  const { response } = await request(`media/${encodeURIComponent(travelerDocumentKey)}`, {
    headers: { authorization: `Bearer ${travelerToken}` },
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("content-type"), "application/pdf");
});

await check("coordinatore vede la griglia documenti completa", async () => {
  const { response, body } = await request("private", { headers: { authorization: `Bearer ${coordinatorToken}` } });
  assert.equal(response.status, 200);
  assert.equal(body.viewer.role, "coordinator");
  assert.ok(body.documents.some((item) => item.profile_id === travelerId && item.doc_type === "passport"));
});

await check("viaggiatore aggiorna soltanto la propria posizione", async () => {
  const own = await request("locations", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${travelerToken}` },
    body: JSON.stringify({ profile_id: travelerId, display_name: "Viaggiatore QA", latitude: 28.6139, longitude: 77.209 }),
  });
  assert.equal(own.response.status, 200);
  const other = await request("locations", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${travelerToken}` },
    body: JSON.stringify({ profile_id: coordinatorId, display_name: "Intrusione", latitude: 28.6, longitude: 77.2 }),
  });
  assert.equal(other.response.status, 403);
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
  commentId = body.id;
});

await check("reazione senza identità bloccata", async () => {
  const { response } = await request("reactions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ post_id: postId, kind: "heart" }),
  });
  assert.equal(response.status, 401);
});

await check("visitatore aggiunge un cuore", async () => {
  const { response, body } = await request("reactions", {
    method: "POST",
    headers: { "content-type": "application/json", "x-guest-token": guestToken, "x-idempotency-key": "qa-reaction-operation-0001" },
    body: JSON.stringify({ post_id: postId, kind: "heart" }),
  });
  assert.equal(response.status, 200);
  assert.equal(body.reaction, "heart");
});

await check("ripetizione idempotente non duplica il cuore", async () => {
  const { response, body } = await request("reactions", {
    method: "POST",
    headers: { "content-type": "application/json", "x-guest-token": guestToken, "x-idempotency-key": "qa-reaction-operation-0001" },
    body: JSON.stringify({ post_id: postId, kind: "heart" }),
  });
  assert.equal(response.status, 200);
  assert.equal(body.reaction, "heart");
});

await check("seconda operazione rimuove il cuore", async () => {
  const { response, body } = await request("reactions", {
    method: "POST",
    headers: { "content-type": "application/json", "x-guest-token": guestToken, "x-idempotency-key": "qa-reaction-operation-0002" },
    body: JSON.stringify({ post_id: postId, kind: "heart" }),
  });
  assert.equal(response.status, 200);
  assert.equal(body.reaction, null);
});

await check("secondo visitatore ottiene identità distinta", async () => {
  const { response, body } = await request("auth/guest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ display_name: "Altro familiare QA" }),
  });
  assert.equal(response.status, 201);
  secondGuestToken = body.token;
});

await check("altro visitatore non modifica il commento", async () => {
  const { response } = await request(`comments/${commentId}`, {
    method: "PUT",
    headers: { "content-type": "application/json", "x-guest-token": secondGuestToken },
    body: JSON.stringify({ text: "Tentativo" }),
  });
  assert.equal(response.status, 403);
});

await check("proprietario modifica il proprio commento", async () => {
  const { response, body } = await request(`comments/${commentId}`, {
    method: "PUT",
    headers: { "content-type": "application/json", "x-guest-token": guestToken },
    body: JSON.stringify({ text: "Commento aggiornato QA" }),
  });
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
});

await check("altro visitatore non elimina il commento", async () => {
  const { response } = await request(`comments/${commentId}`, {
    method: "DELETE",
    headers: { "content-type": "application/json", "x-guest-token": secondGuestToken },
    body: "{}",
  });
  assert.equal(response.status, 403);
});

await check("bacheca pubblica mostra autore e commento aggiornato", async () => {
  const { response, body } = await request("state");
  assert.equal(response.status, 200);
  const post = body.posts.find((item) => item.id === postId);
  assert.ok(post);
  const comment = post.comments.find((item) => item.id === commentId);
  assert.equal(comment.author_name, "Familiare QA");
  assert.equal(comment.text, "Commento aggiornato QA");
});

await check("proprietario elimina il proprio commento", async () => {
  const { response, body } = await request(`comments/${commentId}`, {
    method: "DELETE",
    headers: { "content-type": "application/json", "x-guest-token": guestToken },
    body: "{}",
  });
  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
});

await check("contenuto multimediale sicuro viene pubblicato", async () => {
  const form = new FormData();
  form.set("text", "Foto QA");
  form.set("visibility", "public");
  form.set("file", new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type: "image/jpeg" }), "foto-qa.jpg");
  const { response, body } = await request("posts", {
    method: "POST",
    headers: { authorization: `Bearer ${coordinatorToken}`, "x-idempotency-key": "qa-media-post-operation-0001", "x-qa-silent": "true" },
    body: form,
  });
  assert.equal(response.status, 201);
  assert.equal(body.media.length, 1);
  const mediaResponse = await fetch(`${base}${body.media[0].media_url}`);
  assert.equal(mediaResponse.status, 200);
  assert.equal(mediaResponse.headers.get("content-type"), "image/jpeg");
  const deletion = await request(`posts/${body.id}`, { method: "DELETE", headers: { authorization: `Bearer ${coordinatorToken}` } });
  assert.equal(deletion.response.status, 200);
});

await check("file camuffato viene respinto", async () => {
  const form = new FormData();
  form.set("text", "File non sicuro");
  form.set("visibility", "public");
  form.set("file", new Blob(["<html><script>alert(1)</script></html>"], { type: "image/jpeg" }), "foto.jpg");
  const { response } = await request("posts", {
    method: "POST",
    headers: { authorization: `Bearer ${coordinatorToken}`, "x-idempotency-key": "qa-unsafe-operation-0001", "x-qa-silent": "true" },
    body: form,
  });
  assert.equal(response.status, 400);
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
