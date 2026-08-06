import assert from "node:assert/strict";

const base = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const ownerId = process.env.QA_PROFILE_ID;
const otherId = process.env.QA_SECOND_PROFILE_ID;
const unclaimedId = process.env.QA_UNCLAIMED_PROFILE_ID;
const otherDeviceId = process.env.QA_SECOND_DEVICE_ID;
const owner = { authorization: `Bearer ${process.env.QA_SESSION_TOKEN}` };
const other = { authorization: `Bearer ${process.env.QA_SECOND_SESSION_TOKEN}` };
const coordinator = { authorization: `Bearer ${process.env.QA_COORDINATOR_TOKEN}` };
if (!base || !ownerId || !otherId || !unclaimedId || !otherDeviceId)
  throw new Error("Ambiente QA per il test di non-enumerazione incompleto");

const request = (path, init = {}) => fetch(`${base}${path}`, { cache: "no-store", ...init });
let checks = 0;
const eq = (actual, expected, message) => { checks += 1; assert.deepEqual(actual, expected, message); };
const ok = (condition, message) => { checks += 1; assert.ok(condition, message); };
const signature = async (response) => ({
  status: response.status,
  error: (await response.json().catch(() => ({}))).error || "",
});

const guestDeviceKey = "9".repeat(64);
const guestResponse = await request("/api/auth/guest", {
  method: "POST",
  headers: { "content-type": "application/json", "x-device-key": guestDeviceKey },
  body: JSON.stringify({ display_name: "Familiare non enumerazione" }),
});
eq(guestResponse.status, 201, "sessione familiare locale");
const guestSession = await guestResponse.json();
const guest = { "x-guest-token": guestSession.token, "x-device-key": guestDeviceKey };

const documentForm = new FormData();
documentForm.set("profile_id", ownerId);
documentForm.set("doc_type", "passport");
documentForm.set("file", new Blob(["%PDF-1.4\n% risorsa privata\n%%EOF"], { type: "application/pdf" }), "privato.pdf");
const documentResponse = await request("/api/documents", {
  method: "POST",
  headers: { ...owner, "x-idempotency-key": crypto.randomUUID() },
  body: documentForm,
});
eq(documentResponse.status, 200, "documento privato creato");
const ownerPrivate = await (await request("/api/private", { headers: owner })).json();
const document = ownerPrivate.documents.find((item) => item.profile_id === ownerId && item.doc_type === "passport");
ok(document?.file_key, "chiave documento disponibile al proprietario");
const missingPrivateKey = `private/documents/${crypto.randomUUID()}.pdf`;

eq(
  await signature(await request(`/api/media/${encodeURIComponent(document.file_key)}`)),
  await signature(await request(`/api/media/${encodeURIComponent(missingPrivateKey)}`)),
  "il pubblico non distingue documento esistente e inesistente",
);
eq(
  await signature(await request(`/api/media/${encodeURIComponent(document.file_key)}`, { headers: guest })),
  await signature(await request(`/api/media/${encodeURIComponent(missingPrivateKey)}`, { headers: guest })),
  "il familiare non distingue documento esistente e inesistente",
);
eq(
  await signature(await request(`/api/media/${encodeURIComponent(document.file_key)}`, { headers: other })),
  await signature(await request(`/api/media/${encodeURIComponent(missingPrivateKey)}`, { headers: other })),
  "un altro viaggiatore non distingue documento esistente e inesistente",
);
eq((await request(`/api/media/${encodeURIComponent(document.file_key)}`, { method: "HEAD", headers: owner })).status, 200, "il proprietario apre il proprio documento");

const publicPrivate = await signature(await request("/api/private"));
const guestPrivate = await signature(await request("/api/private", { headers: guest }));
eq(publicPrivate, guestPrivate, "pubblico e familiare ricevono lo stesso diniego senza dettagli");
const otherPrivate = await (await request("/api/private", { headers: other })).json();
ok(!otherPrivate.documents.some((item) => item.profile_id === ownerId), "il viaggiatore non vede metadati documenti altrui");

const ownerDevicesResponse = await request("/api/auth/devices", { headers: owner });
eq(ownerDevicesResponse.status, 200, "il proprietario vede i propri dispositivi");
const ownerDevices = (await ownerDevicesResponse.json()).devices || [];
ok(ownerDevices.every((device) => device.device_id !== otherDeviceId), "nessuna sessione dell’altro profilo nell’elenco");
const otherDeviceAttempt = await signature(await request(`/api/auth/devices/${encodeURIComponent(otherDeviceId)}`, { method: "DELETE", headers: owner }));
const unknownDeviceAttempt = await signature(await request(`/api/auth/devices/${encodeURIComponent(`ignoto-${crypto.randomUUID()}`)}`, { method: "DELETE", headers: owner }));
eq(otherDeviceAttempt, unknownDeviceAttempt, "una sessione altrui non è distinguibile da una inesistente");
eq((await request("/api/auth/session", { headers: other })).status, 200, "il tentativo non revoca la sessione altrui");

const inviteResponse = await request("/api/auth/invites", {
  method: "POST",
  headers: { ...coordinator, "content-type": "application/json" },
  body: JSON.stringify({ profile_id: unclaimedId }),
});
eq(inviteResponse.status, 201, "invito temporaneo creato dal coordinatore");
const invite = await inviteResponse.json();
const actualInviteAttempt = await signature(await request(`/api/auth/invites/${invite.invite_id}`, { method: "DELETE", headers: owner }));
const unknownInviteAttempt = await signature(await request(`/api/auth/invites/${"a".repeat(64)}`, { method: "DELETE", headers: owner }));
eq(actualInviteAttempt, unknownInviteAttempt, "un viaggiatore non distingue invito esistente e inesistente");
eq((await request(`/api/auth/invites/${invite.invite_id}`, { method: "DELETE", headers: coordinator })).status, 200, "il coordinatore revoca l’invito reale");

eq((await request(`/api/documents/${ownerId}/passport`, { method: "DELETE", headers: owner })).status, 200, "pulizia documento temporaneo");
console.log(`P0_RESOURCE_ENUMERATION=${checks}/${checks}`);
