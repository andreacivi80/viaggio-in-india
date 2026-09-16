import { expect, test, devices } from "@playwright/test";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
test.skip(!baseUrl || !isSafeMutationTarget(baseUrl), "URL QA isolato richiesto");
test.use({ serviceWorkers: "block" });

const readPosition = (page) => page.evaluate(() => new Promise((resolve, reject) => {
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
    ({ code, message }) => reject(new Error(`geolocation ${code}: ${message}`)),
    { enableHighAccuracy: true, timeout: 5_000 },
  );
}));

test("permesso posizione sempre e una sola volta rispettano il ciclo di vita mobile", async ({ browser }) => {
  test.setTimeout(60_000);
  const location = { latitude: 13.7563, longitude: 100.5018, accuracy: 25 };

  const alwaysContext = await browser.newContext({
    ...devices["Galaxy S9+"],
    geolocation: location,
    serviceWorkers: "block",
  });
  try {
    await alwaysContext.grantPermissions(["geolocation"], { origin: baseUrl });
    const firstPage = await alwaysContext.newPage();
    await firstPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    expect(await readPosition(firstPage)).toEqual({ latitude: location.latitude, longitude: location.longitude });
    await firstPage.close();

    const reopenedPage = await alwaysContext.newPage();
    await reopenedPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    expect(await reopenedPage.evaluate(async () => (await navigator.permissions.query({ name: "geolocation" })).state)).toBe("granted");
    expect(await readPosition(reopenedPage)).toEqual({ latitude: location.latitude, longitude: location.longitude });
  } finally {
    await alwaysContext.close();
  }

  const onceContext = await browser.newContext({
    ...devices["Galaxy S9+"],
    geolocation: location,
    serviceWorkers: "block",
  });
  try {
    await onceContext.grantPermissions(["geolocation"], { origin: baseUrl });
    const oncePage = await onceContext.newPage();
    await oncePage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    expect(await readPosition(oncePage)).toEqual({ latitude: location.latitude, longitude: location.longitude });
  } finally {
    await onceContext.close();
  }

  const nextSession = await browser.newContext({
    ...devices["Galaxy S9+"],
    geolocation: location,
    serviceWorkers: "block",
  });
  try {
    const nextPage = await nextSession.newPage();
    await nextPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    expect(await nextPage.evaluate(async () => (await navigator.permissions.query({ name: "geolocation" })).state)).not.toBe("granted");
  } finally {
    await nextSession.close();
  }
});
