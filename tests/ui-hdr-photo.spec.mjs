import { test, expect, devices } from "@playwright/test";
import { deflateSync } from "node:zlib";
import { isSafeMutationTarget } from "./helpers/qa-mutation-target.mjs";

const baseUrl = String(process.env.TEST_BASE_URL || "").replace(/\/$/, "");
const profileName = process.env.QA_UI_PROFILE_NAME;
const inviteToken = process.env.QA_UI_INVITE_TOKEN;

test.skip(!profileName || !inviteToken || !isSafeMutationTarget(baseUrl), "Profilo QA e invito richiesti");
test.use({ ...devices["Galaxy S9+"], serviceWorkers: "block" });

const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1)
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const pngChunk = (type, data) => {
  const name = Buffer.from(type, "ascii");
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, checksum]);
};

const hdrPng = () => {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(4, 0);
  ihdr.writeUInt32BE(2, 4);
  ihdr[8] = 16;
  ihdr[9] = 2;
  const rows = [];
  const pixels = [
    [65535, 0, 0], [0, 65535, 0], [0, 0, 65535], [65535, 65535, 65535],
    [65535, 32768, 0], [0, 65535, 65535], [65535, 0, 65535], [8192, 8192, 8192],
  ];
  for (let row = 0; row < 2; row += 1) {
    const scanline = Buffer.alloc(1 + 4 * 6);
    for (let column = 0; column < 4; column += 1) {
      const pixel = pixels[row * 4 + column];
      pixel.forEach((channel, index) => scanline.writeUInt16BE(channel, 1 + column * 6 + index * 2));
    }
    rows.push(scanline);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdr),
    pngChunk("cICP", Buffer.from([9, 16, 0, 1])),
    pngChunk("IDAT", deflateSync(Buffer.concat(rows))),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
};

test("una fotografia HDR 16 bit BT.2020 PQ si pubblica, riapre e conserva il profilo", async ({ page }) => {
  test.setTimeout(90_000);
  let postId = "";
  await page.goto(`${baseUrl}/#invite=${encodeURIComponent(inviteToken)}`, { waitUntil: "networkidle" });
  await expect.poll(() => page.evaluate(() => localStorage.getItem("india-session-token"))).toBeTruthy();
  const sessionToken = await page.evaluate(() => localStorage.getItem("india-session-token"));
  const deviceKey = await page.evaluate(() => localStorage.getItem("india-device-key"));
  const fixture = hdrPng();
  try {
    await page.getByRole("button", { name: "Pubblica", exact: true }).tap();
    const sheet = page.locator(".uploadSheet");
    await sheet.locator('input[accept^="image"]').first().setInputFiles({
      name: "foto-hdr-bt2020-pq-16bit.png",
      mimeType: "image/png",
      buffer: fixture,
    });
    await expect(sheet.getByText("1 allegati pronti")).toBeVisible();
    const marker = `Fotografia HDR QA ${Date.now()}`;
    await sheet.getByPlaceholder("Racconta questo momento…").fill(marker);
    const responsePromise = page.waitForResponse(
      (response) => response.url().endsWith("/api/posts") && response.request().method() === "POST",
    );
    await sheet.locator(".composerActions > button").tap();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    const postResult = await response.json();
    postId = postResult.id;
    expect(postResult.media).toHaveLength(1);

    const post = page.locator(".post").filter({ hasText: marker });
    const image = post.locator("img").first();
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((element) => [element.naturalWidth, element.naturalHeight])).toEqual([4, 2]);

    const mediaResponse = await page.request.get(`${baseUrl}${postResult.media[0].media_url}`, {
      headers: { authorization: `Bearer ${sessionToken}`, "x-device-key": deviceKey },
    });
    expect(mediaResponse.status()).toBe(200);
    const stored = Buffer.from(await mediaResponse.body());
    expect(stored.equals(fixture)).toBe(true);
    expect(stored.includes(Buffer.from("cICP"))).toBe(true);
  } finally {
    if (postId)
      await page.request.delete(`${baseUrl}/api/posts/${encodeURIComponent(postId)}`, {
        headers: { authorization: `Bearer ${sessionToken}`, "x-device-key": deviceKey },
      }).catch(() => {});
  }
});
