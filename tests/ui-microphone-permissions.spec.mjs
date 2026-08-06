import { test, expect, devices } from "@playwright/test";

test.use({
  serviceWorkers: "block",
  launchOptions: {
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  },
});

const profileName = process.env.QA_UI_PROFILE_NAME;
const inviteToken = process.env.QA_UI_INVITE_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");

test.skip(!profileName || !inviteToken || !baseUrl, "Profilo e invito QA locale richiesti");

test("il consenso microfono avvia e conclude una registrazione audio sul telefono", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Galaxy S9+"], serviceWorkers: "block" });
  await context.grantPermissions(["microphone"], { origin: baseUrl });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/#invite=${encodeURIComponent(inviteToken)}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator(".accessPill")).toContainText(profileName.split(" ")[0]);
    await page.getByRole("button", { name: "Pubblica" }).tap();
    const recorder = page.locator(".audioRecorder");
    await recorder.getByRole("button", { name: "Registra" }).tap();
    await expect(recorder).toHaveClass(/recording/);
    await expect(recorder.getByText("Registrazione in corso")).toBeVisible();
    const permission = await page.evaluate(async () =>
      (await navigator.permissions.query({ name: "microphone" })).state,
    );
    expect(permission).toBe("granted");
    await page.waitForTimeout(1_100);
    await recorder.getByRole("button", { name: "Ferma" }).tap();
    await expect(recorder).not.toHaveClass(/recording/);
    await expect(page.locator(".uploadSheet").getByText("1 allegati pronti")).toBeVisible();
    const preview = page.locator(".uploadSheet .attachmentPreviews audio");
    await expect(preview).toHaveCount(1);
    await expect.poll(() => preview.evaluate((audio) => audio.duration)).toBeGreaterThan(0);
  } finally {
    await context.close();
  }
});
