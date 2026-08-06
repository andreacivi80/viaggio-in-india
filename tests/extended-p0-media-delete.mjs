import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const owner = { authorization: `Bearer ${process.env.QA_SESSION_TOKEN}` };
const other = { authorization: `Bearer ${process.env.QA_SECOND_SESSION_TOKEN}` };
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
if (!base || !process.env.QA_SESSION_TOKEN || !process.env.QA_SECOND_SESSION_TOKEN)
  throw new Error("Ambiente QA P0 media incompleto");

const postForm = new FormData();
postForm.set("visibility", "public");
postForm.set("day_index", "-1");
postForm.set("text", `P0 eliminazione media ${crypto.randomUUID()}`);
const exifPayload = new TextEncoder().encode("Exif\0\0Model=Samsung SM-G781B;GPSLatitude=45.4642;GPSLongitude=9.1900");
postForm.append("files", new Blob([
  new Uint8Array([0xff, 0xd8, 0xff, 0xe1]),
  exifPayload,
  new Uint8Array([0xff, 0xd9]),
], { type: "image/jpeg" }), "p0-foto-con-exif.jpg");
postForm.append("files", new Blob([new Uint8Array([0, 0, 0, 16, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d])], { type: "video/mp4" }), "p0-video.mp4");
postForm.append("files", new Blob([new Uint8Array([0x49, 0x44, 0x33, 4, 0, 0, 0, 0, 0, 0])], { type: "audio/mpeg" }), "p0-audio.mp3");
const createdResponse = await request("/api/posts", {
  method: "POST",
  headers: { ...owner, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
  body: postForm,
});
assert.equal(createdResponse.status, 201);
const created = await createdResponse.json();
const ownerState = await (await request("/api/state", { headers: owner })).json();
const post = ownerState.posts.find((item) => item.id === created.id);
assert.equal(post?.media?.length, 3);
assert.ok(!post.place_name);
assert.equal(post.latitude ?? null, null);
assert.equal(post.longitude ?? null, null);
assert.deepEqual(post.media.map((item) => item.media_type).sort(), ["audio/mpeg", "image/jpeg", "video/mp4"]);
for (const media of post.media) {
  const head = await request(media.media_url, { method: "HEAD", headers: owner });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("cache-control"), "public, max-age=31536000, immutable");
  assert.equal(head.headers.get("x-content-type-options"), "nosniff");
  assert.equal(head.headers.get("content-disposition"), "inline");
}
assert.equal((await request(`/api/posts/${created.id}`, { method: "DELETE", headers: other })).status, 403);
assert.equal((await request(`/api/posts/${created.id}`, { method: "DELETE", headers: owner })).status, 200);
for (const media of post.media)
  assert.notEqual((await request(media.media_url, { method: "HEAD", headers: owner })).status, 200);
const [publicAfter, ownerAfter, otherAfter] = await Promise.all([
  request("/api/state").then((response) => response.json()),
  request("/api/state", { headers: owner }).then((response) => response.json()),
  request("/api/state", { headers: other }).then((response) => response.json()),
]);
for (const snapshot of [publicAfter, ownerAfter, otherAfter])
  assert.ok(!snapshot.posts.some((item) => item.id === created.id));

console.log("P0_MEDIA_DELETE=14/14");
