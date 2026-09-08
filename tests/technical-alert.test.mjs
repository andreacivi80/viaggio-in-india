import assert from "node:assert/strict";
import test from "node:test";
import { createECDH, randomBytes } from "node:crypto";
import { reportTechnicalFailure } from "../functions/api/[[path]].js";

const base64url = (value) => Buffer.from(value).toString("base64url");
const keyPair = () => {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  return { publicKey: base64url(ecdh.getPublicKey()), privateKey: base64url(ecdh.getPrivateKey()) };
};

test("un errore server registra l'evento e avvisa soltanto il responsabile coordinatore", async () => {
  const vapid = keyPair();
  const subscriber = keyPair();
  const inserted = [];
  const subscriptions = [
    {
      id: "push-coordinator",
      endpoint: "https://push.example/technical-alert",
      p256dh: subscriber.publicKey,
      auth: base64url(randomBytes(16)),
      profile_id: "coordinator-1",
      guest_visitor_id: "",
      profile_role: "coordinator",
    },
    {
      id: "push-traveler",
      endpoint: "https://push.example/not-authorized",
      p256dh: subscriber.publicKey,
      auth: base64url(randomBytes(16)),
      profile_id: "traveler-1",
      guest_visitor_id: "",
      profile_role: "traveler",
    },
  ];
  const env = {
    VAPID_PUBLIC_KEY: vapid.publicKey,
    VAPID_PRIVATE_KEY: vapid.privateKey,
    DB: {
      prepare(sql) {
        return {
          bind(...values) {
            return { run: async () => { inserted.push({ sql, values }); } };
          },
          all: async () => ({ results: subscriptions }),
        };
      },
    },
  };
  const delivered = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    delivered.push(String(url));
    return new Response("", { status: 201 });
  };
  try {
    const result = await reportTechnicalFailure(env, {
      error_id: "errore-tecnico-123",
      method: "POST",
      path: "posts",
      status: 500,
    });
    assert.equal(result.audit.event_type, "technical_error");
    assert.equal(result.audit.resource_id, "POST posts");
    assert.equal(result.audit.result, "status_500");
    assert.equal(result.delivery.subscribers, 1);
    assert.equal(result.delivery.sent, 1);
    assert.equal(result.delivery.failed, 0);
    assert.deepEqual(delivered, ["https://push.example/technical-alert"]);
    assert.equal(inserted.length, 1);
    assert.equal(JSON.stringify(inserted).includes("SQL con dati riservati"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
