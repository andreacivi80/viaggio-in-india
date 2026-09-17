import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  CAMERA_UNAVAILABLE_MESSAGE,
  cameraSelectionFeedback,
} from "../src/mediaSelectionFeedback.js";

test("camera denied or cancelled produces actionable gallery fallback", () => {
  assert.equal(cameraSelectionFeedback(null), CAMERA_UNAVAILABLE_MESSAGE);
  assert.equal(cameraSelectionFeedback([]), CAMERA_UNAVAILABLE_MESSAGE);
  assert.match(CAMERA_UNAVAILABLE_MESSAGE, /autorizzazione negata/i);
  assert.match(CAMERA_UNAVAILABLE_MESSAGE, /Galleria foto/i);
});

test("a captured photo does not produce a denial message", () => {
  assert.equal(cameraSelectionFeedback([{ name: "scatto.jpg" }]), "");
});

test("camera denial is announced and cannot start an upload", async () => {
  const client = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
  assert.match(client, /const feedback = cameraSelectionFeedback\(e\.target\.files\);/);
  assert.match(client, /if \(feedback\) \{[\s\S]*?setFileStatus\(feedback\);[\s\S]*?return;[\s\S]*?\}/);
  assert.match(client, /role="status"[\s\S]*?\{fileStatus\}/);
  assert.match(client, /> Galleria foto[\s\S]*?accept="image\/\*,\.heic,\.heif"/);
});
