import { test, expect, devices } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const photoPath = fileURLToPath(new URL("../public/cities/agra.jpg", import.meta.url));
const members = [
  {
    label: "Viaggiatore A",
    token: process.env.QA_UI_SESSION_TOKEN,
    id: process.env.QA_UI_PROFILE_ID,
    name: process.env.QA_UI_PROFILE_NAME,
    key: process.env.QA_UI_DEVICE_KEY,
  },
  {
    label: "Viaggiatore B",
    token: process.env.QA_SECOND_SESSION_TOKEN,
    id: process.env.QA_SECOND_PROFILE_ID,
    name: "Secondo QA",
    key: process.env.QA_OTHER_DEVICE_KEY,
  },
  {
    label: "Coordinatrice",
    token: process.env.QA_COORDINATOR_TOKEN,
    id: process.env.QA_COORDINATOR_PROFILE_ID,
    name: "Coordinatore QA",
    key: process.env.QA_COORDINATOR_DEVICE_KEY,
  },
];

test.skip(
  !baseUrl || !isSafeMutationTarget(baseUrl) || members.some((member) => !member.token || !member.id || !member.key),
  "Tre sessioni e URL QA richiesti",
);
test.use({
  serviceWorkers: "block",
  launchOptions: { args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] },
});

test("ogni membro pubblica una fotografia e registra un audio visibili agli altri", async ({ browser }) => {
  test.setTimeout(210_000);
  const created = [];
  const contexts = [];
  try {
    for (const member of members) {
      const context = await browser.newContext({
        ...devices["Galaxy S9+"],
        viewport: { width: 412, height: 915 },
        serviceWorkers: "block",
      });
      contexts.push(context);
      await context.grantPermissions(["microphone"], { origin: baseUrl });
      await context.addInitScript(({ token, id, name, key }) => {
        localStorage.setItem("india-session-token", token);
        localStorage.setItem("india-profile-id", id);
        localStorage.setItem("india-profile-name", name);
        localStorage.setItem("india-visitor-name", name);
        localStorage.setItem("india-role", "traveler");
        localStorage.setItem("india-device-key", key);
      }, member);
      const page = await context.newPage();
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".accessPill")).not.toContainText("Pubblico", { timeout: 20_000 });
      const marker = `${member.label} foto e audio QA ${process.env.QA_RUN_ID}`;
      await page.getByRole("button", { name: "Pubblica", exact: true }).tap();
      const sheet = page.locator(".uploadSheet");
      await sheet.locator('input[accept^="image"]').first().setInputFiles(photoPath);
      const recorder = sheet.locator(".audioRecorder");
      await recorder.getByRole("button", { name: "Registra" }).tap();
      await expect(recorder).toHaveClass(/recording/);
      await page.waitForTimeout(900);
      await recorder.getByRole("button", { name: "Ferma" }).tap();
      await expect(sheet.getByText("2 allegati pronti")).toBeVisible();
      await sheet.getByPlaceholder("Racconta questo momento…").fill(marker);
      const responsePromise = page.waitForResponse(
        (response) => new URL(response.url()).pathname === "/api/posts" && response.request().method() === "POST",
      );
      await sheet.locator(".composerActions > button").tap();
      const response = await responsePromise;
      expect(response.status()).toBe(201);
      const post = await response.json();
      expect(post.media).toHaveLength(2);
      expect(post.media.some((media) => media.type?.startsWith("image/"))).toBe(true);
      expect(post.media.some((media) => media.type?.startsWith("audio/"))).toBe(true);
      const activeToken = await page.evaluate(() => localStorage.getItem("india-session-token"));
      created.push({ id: post.id, token: activeToken, key: member.key, marker });
      const card = page.locator(".post").filter({ hasText: marker });
      await expect(card).toBeVisible();
      await expect(card.locator("img")).toBeVisible();
      await expect(card.getByRole("button", { name: "Ascolta il racconto" })).toBeVisible();
    }

    const observer = contexts[0].pages()[0];
    await observer.reload({ waitUntil: "domcontentloaded" });
    for (const item of created)
      await expect(observer.locator(".post").filter({ hasText: item.marker })).toBeVisible({ timeout: 20_000 });
  } finally {
    for (const item of created)
      await fetch(`${baseUrl}/api/posts/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${item.token}`, "x-device-key": item.key },
      }).catch(() => {});
    await Promise.all(contexts.map((context) => context.close().catch(() => {})));
  }
});
