import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const profileId = process.env.QA_PROFILE_ID;
const authorization = `Bearer ${process.env.QA_SESSION_TOKEN}`;
const headers = { authorization };
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });

if (!base || !profileId || !process.env.QA_SESSION_TOKEN)
  throw new Error("Ambiente QA P0 sostituzione fotografia incompleto");

const onePixelPng = Uint8Array.from([
  137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
  0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
  0, 0, 0, 13, 73, 68, 65, 84, 8, 215, 99, 248, 207, 192, 240, 31,
  0, 5, 0, 1, 255, 137, 153, 61, 29, 0, 0, 0, 0, 73, 69, 78, 68,
  174, 66, 96, 130,
]);

const updateAvatar = async (fileName, suffix) => {
  const form = new FormData();
  form.set("name", "Proprietario");
  form.set("surname", "QA");
  form.set("role", "traveler");
  form.set("bio", suffix);
  form.set("avatar", new Blob([onePixelPng, suffix], { type: "image/png" }), fileName);
  const response = await request(`/api/profiles/${profileId}`, { method: "PUT", headers, body: form });
  assert.equal(response.status, 200, `aggiornamento ${fileName} non riuscito`);
  const payload = await response.json();
  assert.ok(payload.avatar_url, `URL ${fileName} assente`);
  return payload.avatar_url;
};

const oldUrl = await updateAvatar("foto-precedente.png", "precedente");
assert.equal((await request(oldUrl, { method: "HEAD" })).status, 200, "foto precedente non disponibile");

const newUrl = await updateAvatar("foto-nuova.png", "nuova");
assert.notEqual(newUrl, oldUrl, "la nuova fotografia riutilizza la vecchia chiave");
assert.equal((await request(newUrl, { method: "HEAD" })).status, 200, "nuova fotografia non disponibile");
assert.notEqual((await request(oldUrl, { method: "HEAD" })).status, 200, "vecchia fotografia ancora presente in MEDIA");

const stateResponse = await request("/api/state");
assert.equal(stateResponse.status, 200);
const state = await stateResponse.json();
const profile = state.profiles.find((item) => item.id === profileId);
assert.equal(profile?.avatar_url, newUrl, "profilo pubblico non punta alla nuova fotografia");

console.log("P0_AVATAR_REPLACEMENT=7/7");
