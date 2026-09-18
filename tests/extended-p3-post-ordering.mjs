import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const token = process.env.QA_SESSION_TOKEN;
const deviceKey = process.env.QA_OWNER_DEVICE_KEY;
if (!base || !token || !deviceKey) throw new Error("Ambiente QA per ordinamento post incompleto");

const headers = { authorization: `Bearer ${token}`, "x-device-key": deviceKey };
const created = [];
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const request = async (path, init = {}) => {
  let response;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    response = await fetch(`${base}${path}`, init);
    const operationPending = response.status === 409
      && (await response.clone().text()).includes("in elaborazione");
    if (response.status !== 503 && !operationPending) return response;
    await sleep(500 * (attempt + 1));
  }
  return response;
};

await sleep(3500);
try {
  for (let index = 0; index < 3; index += 1) {
    const form = new FormData();
    form.set("visibility", "public");
    form.set("day_index", "-1");
    form.set("text", `QA ordine server ${process.env.QA_RUN_ID} ${index}`);
    form.set("created_at", index === 2 ? "1970-01-01T00:00:00.000Z" : "2999-01-01T00:00:00.000Z");
    const response = await request("/api/posts", {
      method: "POST",
      headers: { ...headers, "x-qa-silent": "true" },
      body: form,
    });
    const responseText = await response.text();
    assert.equal(response.status, 201, responseText);
    const post = JSON.parse(responseText);
    assert.ok(post.id);
    assert.ok(Date.parse(post.created_at) > Date.parse("2025-01-01T00:00:00.000Z"));
    created.push(post);
    await sleep(30);
  }

  assert.ok(Date.parse(created[0].created_at) <= Date.parse(created[1].created_at));
  assert.ok(Date.parse(created[1].created_at) <= Date.parse(created[2].created_at));
  const stateResponse = await request("/api/state", { headers, cache: "no-store" });
  assert.equal(stateResponse.status, 200);
  const state = await stateResponse.json();
  const order = state.posts.filter((post) => created.some((candidate) => candidate.id === post.id)).map((post) => post.id);
  assert.deepEqual(order, created.map((post) => post.id).reverse());
  console.log("P3_POST_ORDERING=10/10");
} finally {
  for (const post of created)
    await request(`/api/posts/${post.id}`, { method: "DELETE", headers }).catch(() => {});
}
