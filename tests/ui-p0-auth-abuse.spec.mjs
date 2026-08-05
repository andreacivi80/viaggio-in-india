import { test, expect } from "@playwright/test";

const profileIds = async (request) => {
  const response = await request.get("/api/state", { headers: { "cache-control": "no-store" } });
  expect(response.ok()).toBeTruthy();
  const state = await response.json();
  return (state.profiles || []).map((profile) => profile.id).sort();
};

test("P0: cento codici gruppo errati non aprono accessi e attivano il limite", async ({ request }) => {
  test.setTimeout(120_000);
  const before = await profileIds(request);
  const statuses = [];
  for (let index = 0; index < 100; index += 1) {
    const response = await request.post("/api/auth/group", {
      headers: { "x-group-code": `errato-${index}` },
    });
    statuses.push(response.status());
  }
  expect(statuses).not.toContain(200);
  expect(statuses.every((status) => status === 403 || status === 429)).toBeTruthy();
  expect(statuses).toContain(429);
  expect(await profileIds(request)).toEqual(before);
});

test("P0: cento inviti errati non creano sessioni o profili", async ({ request }) => {
  test.setTimeout(120_000);
  const before = await profileIds(request);
  const statuses = [];
  for (let index = 0; index < 100; index += 1) {
    const response = await request.post("/api/auth/claim", {
      data: { invite_token: `invito-inesistente-${index}` },
    });
    statuses.push(response.status());
  }
  expect(statuses).not.toContain(200);
  expect(statuses).not.toContain(201);
  expect(statuses.every((status) => status === 403 || status === 429)).toBeTruthy();
  expect(statuses).toContain(429);
  expect(await profileIds(request)).toEqual(before);
});

test("P0: cento sessioni false non leggono l'area privata", async ({ request }) => {
  test.setTimeout(120_000);
  const statuses = [];
  for (let index = 0; index < 100; index += 1) {
    const response = await request.get("/api/private", {
      headers: { authorization: `Bearer sessione-falsa-${index}` },
    });
    statuses.push(response.status());
  }
  expect(new Set(statuses)).toEqual(new Set([401]));
});
