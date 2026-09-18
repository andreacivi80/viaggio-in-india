import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  groupSecretMatches,
  issueAdminStepUp,
  validAdminStepUp,
} from "../functions/api/[[path]].js";

const env = { GROUP_CODE: "qa-secret-not-production" };
const session = {
  profile_id: "coordinator-1",
  device_id: "device-1",
  role: "coordinator",
};

test("la password amministrativa viene confrontata senza persistenza", async () => {
  assert.equal(await groupSecretMatches("qa-secret-not-production", env.GROUP_CODE), true);
  assert.equal(await groupSecretMatches("password-errata", env.GROUP_CODE), false);
  assert.equal(await groupSecretMatches("", env.GROUP_CODE), false);
});

test("lo step-up firmato è breve e vincolato a profilo e dispositivo", async () => {
  const issued = await issueAdminStepUp(env, session);
  const request = new Request("https://qa.example/api/private", {
    headers: { "x-admin-step-up": issued.token },
  });
  assert.equal(await validAdminStepUp(request, env, session), true);
  assert.equal(await validAdminStepUp(request, env, { ...session, device_id: "device-2" }), false);
  assert.equal(await validAdminStepUp(request, env, { ...session, profile_id: "coordinator-2" }), false);
  assert.equal(await validAdminStepUp(request, env, { ...session, role: "traveler" }), false);
  const [payload, signature] = issued.token.split(".");
  const replacement = signature.startsWith("x") ? "y" : "x";
  const tampered = new Request("https://qa.example/api/private", {
    headers: { "x-admin-step-up": `${payload}.${replacement}${signature.slice(1)}` },
  });
  assert.equal(await validAdminStepUp(tampered, env, session), false);
  assert.ok(Date.parse(issued.expires_at) - Date.now() <= 10 * 60 * 1000);
});

test("client e API applicano lo step-up alle superfici amministrative", () => {
  const worker = fs.readFileSync(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");
  const client = fs.readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
  for (const route of ["auth/invites", "security/audit", "push/test", "retention-extension/"])
    assert.match(worker, new RegExp(`${route.replace("/", "\\/")}[\\s\\S]{0,700}requireAdminStepUp`));
  assert.match(worker, /adminVerified[\s\S]*?document_status/);
  assert.match(worker, /document\.profile_id !== session\.profile_id[\s\S]*?requireAdminStepUp/);
  assert.match(client, /sessionStorage\.setItem\("thailand-admin-step-up"/);
  assert.match(client, /x-admin-step-up/);
  assert.match(client, /AdminStepUpPanel/);
  assert.doesNotMatch(client, /localStorage\.setItem\("thailand-admin-step-up"/);
});
