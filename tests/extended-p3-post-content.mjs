import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const token = process.env.QA_SESSION_TOKEN;
const deviceKey = process.env.QA_OWNER_DEVICE_KEY;
assert.match(base, /viaggio-in-india-2026-qa\.pages\.dev$/);
assert.ok(token && deviceKey);
const auth = { authorization: `Bearer ${token}`, "x-device-key": deviceKey };
const created = [];

const publish = async ({ text = "", day = -1, place = "", file = null }) => {
  const form = new FormData();
  form.set("visibility", "public");
  form.set("day_index", String(day));
  form.set("text", text);
  if (place) form.set("place_name", place);
  if (file) form.append("files", file, "solo-foto.jpg");
  const response = await fetch(`${base}/api/posts`, {
    method: "POST",
    headers: { ...auth, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: form,
  });
  const body = await response.text();
  assert.equal(response.status, 201, body);
  const post = JSON.parse(body);
  created.push(post.id);
  return post;
};

try {
  const emojiText = `Thailandia 🌴✈️🇹🇭🙏 ${process.env.QA_RUN_ID}`;
  const emoji = await publish({ text: emojiText });
  assert.equal(emoji.text, emojiText);

  const longText = `INIZIO-${"ภาษาไทย viaggio lungo ".repeat(1_000)}-FINE`;
  const long = await publish({ text: longText });
  assert.equal(long.text, longText);

  const photoOnly = await publish({
    file: new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0xff, 0xd9])], { type: "image/jpeg" }),
  });
  assert.equal(photoOnly.text, "");
  assert.equal(photoOnly.media.length, 1);

  const manualPlace = await publish({ text: "Luogo manuale QA", place: "Bangkok scritto manualmente" });
  assert.equal(manualPlace.place_name, "Bangkok scritto manualmente");
  assert.equal(manualPlace.latitude, null);
  assert.equal(manualPlace.longitude, null);

  const days = [];
  for (let day = 0; day < 11; day += 1)
    days.push(await publish({ text: `Giornata ${day + 1} QA ${process.env.QA_RUN_ID}`, day }));
  assert.deepEqual(days.map(({ day_index }) => day_index), Array.from({ length: 11 }, (_, index) => index));

  const stateResponse = await fetch(`${base}/api/state`, { headers: auth, cache: "no-store" });
  assert.equal(stateResponse.status, 200);
  const state = await stateResponse.json();
  const byId = new Map(state.posts.map((post) => [post.id, post]));
  assert.ok(created.every((id) => byId.has(id)));
  assert.equal(byId.get(long.id).text, longText);
  assert.equal(byId.get(photoOnly.id).text, "");
  assert.equal(byId.get(manualPlace.id).place_name, "Bangkok scritto manualmente");
  console.log("P3_POST_CONTENT=EMOJI;LONG;PHOTO_ONLY;MANUAL_PLACE;11/11_DAYS");
} finally {
  for (const id of created) {
    const response = await fetch(`${base}/api/posts/${encodeURIComponent(id)}`, { method: "DELETE", headers: auth });
    assert.equal(response.status, 200);
  }
}
