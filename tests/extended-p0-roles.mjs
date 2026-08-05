import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const travelerId = process.env.QA_PROFILE_ID;
const otherId = process.env.QA_SECOND_PROFILE_ID;
const inviteTargetId = process.env.QA_UNCLAIMED_PROFILE_ID;
const coordinatorId = process.env.QA_COORDINATOR_PROFILE_ID;
const traveler = { authorization: `Bearer ${process.env.QA_SESSION_TOKEN}` };
const coordinator = { authorization: `Bearer ${process.env.QA_COORDINATOR_TOKEN}` };
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
if (!base || !travelerId || !otherId || !inviteTargetId || !coordinatorId) throw new Error("Ambiente QA P0 ruoli incompleto");

const profileForm = (name, role) => {
  const form = new FormData();
  form.set("name", name);
  form.set("surname", "QA");
  form.set("age", "");
  form.set("job", "");
  form.set("origin_city", "");
  form.set("bio", "");
  form.set("gender", "");
  form.set("role", role);
  return form;
};
const sessionRole = async (headers) => {
  const response = await request("/api/auth/session", { headers });
  assert.equal(response.status, 200);
  return (await response.json()).profile.role;
};

assert.equal((await request("/api/profiles", {
  method: "POST",
  headers: traveler,
  body: profileForm("Creazione vietata", "coordinator"),
})).status, 403);
assert.equal((await request(`/api/profiles/${otherId}`, {
  method: "PUT",
  headers: traveler,
  body: profileForm("Secondo", "coordinator"),
})).status, 403);
assert.equal((await request("/api/auth/invites", {
  method: "POST",
  headers: { ...traveler, "content-type": "application/json" },
  body: JSON.stringify({ profile_id: inviteTargetId }),
})).status, 403);

assert.equal((await request(`/api/profiles/${travelerId}`, {
  method: "PUT",
  headers: coordinator,
  body: profileForm("Proprietario", "coordinator"),
})).status, 200);
assert.equal(await sessionRole(traveler), "coordinator");
assert.equal((await request("/api/auth/invites", {
  method: "POST",
  headers: { ...traveler, "content-type": "application/json" },
  body: JSON.stringify({ profile_id: inviteTargetId }),
})).status, 201);

assert.equal((await request(`/api/profiles/${travelerId}`, {
  method: "PUT",
  headers: coordinator,
  body: profileForm("Proprietario", "traveler"),
})).status, 200);
assert.equal(await sessionRole(traveler), "traveler");
assert.equal((await request("/api/auth/invites", {
  method: "POST",
  headers: { ...traveler, "content-type": "application/json" },
  body: JSON.stringify({ profile_id: inviteTargetId }),
})).status, 403);

assert.equal((await request(`/api/profiles/${travelerId}`, {
  method: "PUT",
  headers: traveler,
  body: profileForm("Proprietario", "coordinator"),
})).status, 200);
assert.equal(await sessionRole(traveler), "traveler");

const postForm = new FormData();
postForm.set("visibility", "public");
postForm.set("day_index", "-1");
postForm.set("text", `P0 identità ruolo ${crypto.randomUUID()}`);
postForm.set("author_name", "Coordinatore falsificato");
const postResponse = await request("/api/posts", {
  method: "POST",
  headers: { ...traveler, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
  body: postForm,
});
assert.equal(postResponse.status, 201);
const post = await postResponse.json();
assert.notEqual(post.author_name, "Coordinatore falsificato");
assert.equal((await request(`/api/posts/${post.id}`, { method: "DELETE", headers: traveler })).status, 200);

const coordinatorPostForm = new FormData();
coordinatorPostForm.set("visibility", "public");
coordinatorPostForm.set("day_index", "-1");
coordinatorPostForm.set("text", `P0 identità coordinatore ${crypto.randomUUID()}`);
coordinatorPostForm.set("author_name", "Profilo diverso falsificato");
const coordinatorPostResponse = await request("/api/posts", {
  method: "POST",
  headers: { ...coordinator, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
  body: coordinatorPostForm,
});
assert.equal(coordinatorPostResponse.status, 201);
const coordinatorPost = await coordinatorPostResponse.json();
assert.equal(coordinatorPost.profile_id, coordinatorId);
assert.notEqual(coordinatorPost.author_name, "Profilo diverso falsificato");
assert.equal((await request(`/api/posts/${coordinatorPost.id}`, { method: "DELETE", headers: coordinator })).status, 200);

console.log("P0_ROLES=18/18");
