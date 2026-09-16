import { expect, test } from "@playwright/test";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const profileId = process.env.QA_UI_PROFILE_ID;
const phoneA = { token: process.env.QA_UI_SESSION_TOKEN, key: process.env.QA_UI_DEVICE_KEY };
const phoneB = { token: process.env.QA_SECOND_DEVICE_TOKEN, key: process.env.QA_SECOND_DEVICE_KEY };

test.skip(
  !baseUrl || !isSafeMutationTarget(baseUrl) || !profileId ||
    Object.values(phoneA).some((value) => !value) || Object.values(phoneB).some((value) => !value),
  "Profilo QA con due telefoni richiesto",
);

const headers = (phone, operation) => ({
  authorization: `Bearer ${phone.token}`,
  "x-device-key": phone.key,
  "x-idempotency-key": operation,
  "content-type": "application/json",
});

test("due telefoni aggiornano insieme la stessa posizione senza duplicati o dati misti", async () => {
  const run = process.env.QA_RUN_ID || crypto.randomUUID();
  const candidates = [
    { latitude: 13.7563, longitude: 100.5018, accuracy: 18 },
    { latitude: 7.8804, longitude: 98.3923, accuracy: 42 },
  ];
  try {
    const responses = await Promise.all([
      fetch(`${baseUrl}/api/locations`, {
        method: "POST",
        headers: headers(phoneA, `location-phone-a-${run}`),
        body: JSON.stringify({ profile_id: profileId, ...candidates[0] }),
      }),
      fetch(`${baseUrl}/api/locations`, {
        method: "POST",
        headers: headers(phoneB, `location-phone-b-${run}`),
        body: JSON.stringify({ profile_id: profileId, ...candidates[1] }),
      }),
    ]);
    expect(responses.map(({ status }) => status)).toEqual([200, 200]);

    const stateResponse = await fetch(`${baseUrl}/api/private`, {
      headers: { authorization: `Bearer ${phoneA.token}`, "x-device-key": phoneA.key },
      cache: "no-store",
    });
    expect(stateResponse.status).toBe(200);
    const locations = (await stateResponse.json()).locations.filter((item) => item.profile_id === profileId);
    expect(locations).toHaveLength(1);
    expect(candidates.some((candidate) =>
      locations[0].latitude === candidate.latitude &&
      locations[0].longitude === candidate.longitude &&
      locations[0].accuracy === candidate.accuracy)).toBe(true);
  } finally {
    const cleanup = await fetch(`${baseUrl}/api/locations/${encodeURIComponent(profileId)}`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${phoneA.token}`, "x-device-key": phoneA.key },
    });
    expect([200, 404]).toContain(cleanup.status);
  }
});
