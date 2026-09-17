import { expect, test, devices } from "@playwright/test";

test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

test("A0205: le richieste di rete restano HTTPS, senza segreti e con API non pubblicamente cacheabili", async ({ page, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const firstPartyFailures = [];
  const apiResponses = [];
  const requestedUrls = [];

  page.on("request", (request) => requestedUrls.push(request.url()));
  page.on("requestfailed", (request) => {
    if (new URL(request.url()).origin === origin) firstPartyFailures.push(request.url());
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.origin === origin && url.pathname.startsWith("/api/"))
      apiResponses.push({ url: response.url(), status: response.status(), cache: response.headers()["cache-control"] || "" });
  });

  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator(".tabs").getByRole("button", { name: "Viaggio" }).tap();
  await expect(page.getByRole("heading", { name: /La storia, giorno per giorno/i })).toBeVisible();
  await page.locator(".tabs").getByRole("button", { name: "Bacheca" }).tap();
  await expect(page.getByRole("heading", { name: /Raccontiamocele insieme/i })).toBeVisible();

  expect(firstPartyFailures).toEqual([]);
  expect(apiResponses.length).toBeGreaterThan(0);
  for (const response of apiResponses) {
    expect(response.status, response.url).toBeLessThan(500);
    if (/public|max-age=[1-9]/i.test(response.cache)) {
      const pathname = new URL(response.url).pathname;
      expect(pathname, `cache pubblica inattesa: ${response.url}`).toMatch(/^\/api\/(?:weather|sun|places(?:\/|$))/);
    }
  }
  for (const requestedUrl of requestedUrls) {
    const url = new URL(requestedUrl);
    expect(["https:", "blob:"], requestedUrl).toContain(url.protocol);
    if (url.protocol === "blob:") expect(requestedUrl, requestedUrl).toMatch(new RegExp(`^blob:${origin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/`));
    expect(Array.from(url.searchParams.keys()).join(" "), requestedUrl).not.toMatch(/password|secret|session|token|group_code/i);
  }
});
