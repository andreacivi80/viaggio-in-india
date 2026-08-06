import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const validToken = process.env.QA_SESSION_TOKEN;
const expiredToken = process.env.QA_EXPIRED_SESSION_TOKEN;
const groupCode = process.env.QA_GROUP_CODE;
if (!base || !validToken || !expiredToken || !groupCode)
  throw new Error("Ambiente QA P0 confini accesso incompleto");

const deviceKey = "1".repeat(64);
const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
const bearer = (token, includeDevice = false) => ({
  authorization: `Bearer ${token}`,
  ...(includeDevice ? { "x-device-key": deviceKey } : {}),
});
const noStore = (response, label) =>
  assert.match(response.headers.get("cache-control") || "", /(?:^|,)\s*(?:private,\s*)?no-store(?:,|$)/i, label);

let checks = 0;
const eq = (actual, expected, message) => { checks += 1; assert.equal(actual, expected, message); };
const ok = (condition, message) => { checks += 1; assert.ok(condition, message); };
const checkNoStore = (response, message) => { checks += 1; noStore(response, message); };

const anonymousPrivate = await request("/api/private");
eq(anonymousPrivate.status, 401, "il pubblico non apre l’area privata");
checkNoStore(anonymousPrivate, "il diniego privato non deve essere memorizzato");

const groupOnlyPrivate = await request("/api/private", { headers: { "x-group-code": groupCode } });
eq(groupOnlyPrivate.status, 401, "la password comune non apre endpoint personali");
checkNoStore(groupOnlyPrivate, "il diniego con password comune non deve essere memorizzato");

const expiredPrivate = await request("/api/private", { headers: bearer(expiredToken) });
eq(expiredPrivate.status, 401, "una sessione scaduta resta non valida");
checkNoStore(expiredPrivate, "la risposta alla sessione scaduta non deve essere memorizzata");

const mutatedToken = `${validToken.slice(0, -1)}${validToken.at(-1) === "a" ? "b" : "a"}`;
eq((await request("/api/auth/session", { headers: bearer(mutatedToken, true) })).status, 401, "un token alterato è respinto");

const validSession = await request("/api/auth/session", { headers: bearer(validToken, true) });
eq(validSession.status, 200, "la sessione valida legata al dispositivo resta utilizzabile");
checkNoStore(validSession, "lo stato della sessione valida non deve essere memorizzato");

const validPrivate = await request("/api/private", { headers: bearer(validToken, true) });
eq(validPrivate.status, 200, "il proprietario autenticato apre la propria area");
checkNoStore(validPrivate, "i dati privati autorizzati non devono essere memorizzati");
const privateBody = await validPrivate.json();
ok(Boolean(privateBody.viewer?.profile_id), "l’area privata identifica il profilo dalla sessione server");

const unauthorizedStatuses = await Promise.all(
  Array.from({ length: 25 }, (_, index) => request("/api/private", {
    headers: bearer(`sessione-falsa-${index}`),
  }).then((response) => response.status)),
);
ok(unauthorizedStatuses.every((status) => status === 401), "i tentativi ripetuti non recuperano privilegi");

const beforeProfiles = await (await request("/api/state")).json();
const badGroupStatuses = [];
for (let index = 0; index < 12; index += 1) {
  const response = await request("/api/auth/group", {
    method: "POST",
    headers: { "x-group-code": `codice-errato-${index}` },
  });
  badGroupStatuses.push(response.status);
}
ok(badGroupStatuses.every((status) => status === 403 || status === 429), "i codici errati non ottengono successo");
ok(badGroupStatuses.includes(429), "l’aumento dei tentativi errati attiva il limite");
const afterProfiles = await (await request("/api/state")).json();
eq(afterProfiles.profiles.length, beforeProfiles.profiles.length, "i tentativi errati non creano profili");

eq(checks, 16, "conteggio verifiche P0 confini accesso");
console.log(`P0_ACCESS_SESSION_BOUNDARIES=${checks}/${checks}`);
process.exit(0);
