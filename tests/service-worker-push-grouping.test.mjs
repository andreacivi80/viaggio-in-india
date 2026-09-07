import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

function serviceWorkerRuntime() {
  const listeners = new Map();
  const visibleByTag = new Map();
  const self = {
    location: { origin: "https://viaggio-in-thailandia-2026.pages.dev" },
    registration: {
      showNotification: async (title, options) => {
        visibleByTag.set(options.tag, { title, options });
      },
    },
    addEventListener(type, listener) { listeners.set(type, listener); },
    skipWaiting() {},
    clients: { claim: async () => {} },
  };
  vm.runInNewContext(source, {
    self,
    importScripts() {},
    caches: {},
    fetch: async () => { throw new Error("non usato"); },
    URL,
  });
  return { listeners, visibleByTag };
}

async function dispatchPush(listener, payload) {
  let completion;
  listener({
    data: { json: () => payload, text: () => JSON.stringify(payload) },
    waitUntil(promise) { completion = promise; },
  });
  await completion;
}

test("due push con lo stesso tag vengono raggruppati in un solo avviso", async () => {
  const { listeners, visibleByTag } = serviceWorkerRuntime();
  const push = listeners.get("push");
  assert.equal(typeof push, "function");
  await dispatchPush(push, { title: "Thailandia Insieme", body: "Primo", tag: "post-42", url: "/?post=42" });
  await dispatchPush(push, { title: "Thailandia Insieme", body: "Secondo", tag: "post-42", url: "/?post=42" });
  assert.equal(visibleByTag.size, 1);
  assert.equal(visibleByTag.get("post-42").options.body, "Secondo");
  assert.equal(visibleByTag.get("post-42").options.renotify, true);
  assert.equal(visibleByTag.get("post-42").options.data.url, "/?post=42");
});

test("tag differenti conservano avvisi distinti", async () => {
  const { listeners, visibleByTag } = serviceWorkerRuntime();
  const push = listeners.get("push");
  await dispatchPush(push, { tag: "post-1", url: "/?post=1" });
  await dispatchPush(push, { tag: "comment-2", url: "/?post=1&comment=2" });
  assert.equal(visibleByTag.size, 2);
  assert.deepEqual([...visibleByTag.keys()], ["post-1", "comment-2"]);
});
