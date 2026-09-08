import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");

function serviceWorkerRuntime({ windowClients = [] } = {}) {
  const listeners = new Map();
  const visibleByTag = new Map();
  const openedWindows = [];
  const clients = {
    claim: async () => {},
    matchAll: async () => windowClients,
    openWindow: async (url) => {
      openedWindows.push(url);
      return { url };
    },
  };
  const self = {
    location: { origin: "https://viaggio-in-thailandia-2026.pages.dev" },
    registration: {
      showNotification: async (title, options) => {
        visibleByTag.set(options.tag, { title, options });
      },
    },
    addEventListener(type, listener) { listeners.set(type, listener); },
    skipWaiting() {},
    clients,
  };
  vm.runInNewContext(source, {
    self,
    clients,
    importScripts() {},
    caches: {},
    fetch: async () => { throw new Error("non usato"); },
    URL,
  });
  return { listeners, visibleByTag, openedWindows };
}

async function dispatchPush(listener, payload) {
  let completion;
  listener({
    data: { json: () => payload, text: () => JSON.stringify(payload) },
    waitUntil(promise) { completion = promise; },
  });
  await completion;
}

async function dispatchNotificationClick(listener, notification) {
  let completion;
  listener({
    notification,
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

test("a telefono bloccato la push resta visibile e il tocco riapre il contenuto", async () => {
  const { listeners, visibleByTag, openedWindows } = serviceWorkerRuntime();
  await dispatchPush(listeners.get("push"), {
    title: "Thailandia Insieme",
    body: "Nuovo ricordo",
    tag: "post-bloccato",
    url: "/?post=ricordo-bloccato",
  });
  const shown = visibleByTag.get("post-bloccato");
  assert.ok(shown, "la notifica deve essere mostrata anche senza finestre dell'app aperte");
  let closed = false;
  await dispatchNotificationClick(listeners.get("notificationclick"), {
    data: shown.options.data,
    close() { closed = true; },
  });
  assert.equal(closed, true);
  assert.deepEqual(openedWindows, ["/?post=ricordo-bloccato"]);
});

test("il tocco sulla push riusa e porta in primo piano l'app già aperta", async () => {
  const actions = [];
  const appWindow = {
    navigate: async (url) => { actions.push(["navigate", url]); },
    focus: async () => { actions.push(["focus"]); },
  };
  const { listeners } = serviceWorkerRuntime({ windowClients: [appWindow] });
  await dispatchNotificationClick(listeners.get("notificationclick"), {
    data: { url: "/?post=ricordo-esistente" },
    close() {},
  });
  assert.deepEqual(actions, [
    ["navigate", "/?post=ricordo-esistente"],
    ["focus"],
  ]);
});
