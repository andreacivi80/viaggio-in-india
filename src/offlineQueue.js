const DB_NAME = "india-insieme-offline";
const DB_VERSION = 1;
const STORE = "requests";

function openQueue() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error("Archivio offline non disponibile"));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE))
        db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transact(mode, action) {
  return openQueue().then((db) => new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    const request = action(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
  }));
}

export async function queueFormRequest({
  id,
  endpoint,
  form,
  authType,
  guestName = "",
  operationKey,
}) {
  const entries = [];
  for (const [name, value] of form.entries())
    entries.push({ name, value });
  await transact("readwrite", (store) => store.put({
    id,
    endpoint,
    method: "POST",
    authType,
    guestName,
    operationKey,
    entries,
    attempts: 0,
    createdAt: new Date().toISOString(),
  }));
  return id;
}

export async function queuedRequestCount() {
  return Number(await transact("readonly", (store) => store.count()));
}

async function allRequests() {
  return (await transact("readonly", (store) => store.getAll())) || [];
}

async function removeRequest(id) {
  await transact("readwrite", (store) => store.delete(id));
}

async function updateRequest(item) {
  await transact("readwrite", (store) => store.put(item));
}

async function authorizationHeaders(item) {
  if (item.authType === "session") {
    const token = localStorage.getItem("india-session-token") || "";
    return token ? { authorization: `Bearer ${token}` } : null;
  }
  if (item.authType === "guest") {
    let token = localStorage.getItem("india-guest-token") || "";
    if (!token && item.guestName) {
      const response = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ display_name: item.guestName }),
      });
      if (!response.ok) return null;
      const guest = await response.json();
      token = guest.token;
      localStorage.setItem("india-guest-token", token);
      localStorage.setItem("india-guest-name", guest.display_name);
      localStorage.setItem("india-visitor-id", guest.visitor_id);
    }
    return token ? { "x-guest-token": token } : null;
  }
  return {};
}

export async function flushOfflineQueue() {
  if (!navigator.onLine) return { sent: 0, pending: await queuedRequestCount() };
  let sent = 0;
  for (const item of await allRequests()) {
    const identity = await authorizationHeaders(item);
    if (!identity) continue;
    const form = new FormData();
    for (const entry of item.entries) form.append(entry.name, entry.value);
    try {
      const response = await fetch(item.endpoint, {
        method: item.method,
        headers: {
          ...identity,
          "x-idempotency-key": item.operationKey,
        },
        body: form,
      });
      if (response.ok) {
        await removeRequest(item.id);
        sent += 1;
      } else if (response.status >= 400 && response.status < 500 && response.status !== 409) {
        item.attempts += 1;
        item.lastStatus = response.status;
        item.lastError = (await response.json().catch(() => ({}))).error || "Richiesta rifiutata";
        await updateRequest(item);
      } else {
        item.attempts += 1;
        item.lastStatus = response.status;
        await updateRequest(item);
      }
    } catch {
      item.attempts += 1;
      await updateRequest(item);
      break;
    }
  }
  return { sent, pending: await queuedRequestCount() };
}
