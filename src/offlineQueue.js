import { shouldUseResumableUpload, uploadFileResumable } from "./resumableUpload.js";

const DB_NAME = "india-insieme-offline";
const DB_VERSION = 1;
const STORE = "requests";

function signalQueueChanged() {
  if (typeof globalThis.dispatchEvent === "function" && typeof globalThis.Event === "function")
    globalThis.dispatchEvent(new Event("offline-queue-changed"));
}

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
    let transaction;
    let request;
    let result;
    let requestError;
    try {
      transaction = db.transaction(STORE, mode);
      request = action(transaction.objectStore(STORE));
    } catch (error) {
      try { transaction?.abort(); } catch { /* transazione già terminata */ }
      db.close();
      reject(error);
      return;
    }
    request.onsuccess = () => { result = request.result; };
    request.onerror = () => { requestError = request.error; };
    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error || requestError || new Error("Salvataggio offline annullato"));
    };
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
  for (const [name, value] of form.entries()) {
    const isFile = typeof Blob !== "undefined" && value instanceof Blob;
    entries.push({
      name,
      value,
      ...(isFile
        ? {
            isFile: true,
            filename:
              typeof value.name === "string" && value.name
                ? value.name
                : "allegato",
            lastModified: Number.isFinite(value.lastModified) ? value.lastModified : 0,
          }
        : {}),
    });
  }
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
  signalQueueChanged();
  return id;
}

export async function queueJsonRequest({
  id,
  endpoint,
  body,
  authType,
  method = "POST",
  operationKey,
}) {
  await transact("readwrite", (store) => store.put({
    id,
    endpoint,
    method,
    authType,
    operationKey,
    payloadType: "json",
    body,
    entries: [],
    attempts: 0,
    createdAt: new Date().toISOString(),
  }));
  signalQueueChanged();
  return id;
}

export async function queuedRequestCount() {
  return Number(await transact("readonly", (store) => store.count()));
}

async function allRequests() {
  return (await transact("readonly", (store) => store.getAll())) || [];
}

export async function queuedRequests() {
  return (await allRequests())
    .sort((left, right) => String(left.createdAt).localeCompare(String(right.createdAt)))
    .map((item) => ({
      id: item.id,
      endpoint: item.endpoint,
      attempts: Number(item.attempts || 0),
      createdAt: item.createdAt,
      attachmentCount: (item.entries || []).filter((entry) => entry.isFile).length,
    }));
}

async function removeRequest(id) {
  await transact("readwrite", (store) => store.delete(id));
}

export async function removeQueuedRequest(id) {
  if (!id) return false;
  await removeRequest(id);
  signalQueueChanged();
  return true;
}

async function updateRequest(item) {
  await transact("readwrite", (store) => store.put(item));
}

async function authorizationHeaders(item) {
  if (item.authType === "session") {
    const token = localStorage.getItem("india-session-token") || "";
    const deviceKey = localStorage.getItem("india-device-key") || "";
    return token && deviceKey
      ? { authorization: `Bearer ${token}`, "x-device-key": deviceKey }
      : null;
  }
  if (item.authType === "guest") {
    let token = localStorage.getItem("india-guest-token") || "";
    const deviceKey = localStorage.getItem("india-device-key") || "";
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
    return token && deviceKey
      ? { "x-guest-token": token, "x-device-key": deviceKey }
      : null;
  }
  return {};
}

async function replayForm(item, identity) {
  const form = new FormData();
  for (const entry of item.entries || []) {
    if (entry.isFile && entry.value instanceof Blob) {
      const filename = entry.filename || "allegato";
      const file = new File([entry.value], filename, {
        type: entry.value.type,
        lastModified: entry.lastModified || 0,
      });
      form.append(entry.name, file);
    } else form.append(entry.name, entry.value);
  }
  const api = item.endpoint.slice(0, item.endpoint.lastIndexOf("/"));
  if (item.endpoint.endsWith("/posts")) {
    const files = form.getAll("files");
    if (files.some((file) => file instanceof Blob && shouldUseResumableUpload(file))) {
      let descriptions = [];
      try {
        const parsed = JSON.parse(String(form.get("media_descriptions") || "[]"));
        if (Array.isArray(parsed)) descriptions = parsed;
      } catch { /* vecchia bozza senza descrizioni valide */ }
      const directDescriptions = [];
      const uploadedDescriptions = [];
      const uploadIds = [];
      form.delete("files");
      for (const [index, file] of files.entries()) {
        if (shouldUseResumableUpload(file)) {
          const uploaded = await uploadFileResumable({
            api, file, scope: "post", visibility: String(form.get("visibility") || "private"), headers: identity,
          });
          uploadIds.push(uploaded.upload_id);
          uploadedDescriptions.push(descriptions[index] || "");
        } else {
          form.append("files", file);
          directDescriptions.push(descriptions[index] || "");
        }
      }
      form.set("upload_ids", JSON.stringify(uploadIds));
      form.set("media_descriptions", JSON.stringify([...directDescriptions, ...uploadedDescriptions]));
    }
  } else if (item.endpoint.endsWith("/documents")) {
    const file = form.get("file");
    if (file instanceof Blob && shouldUseResumableUpload(file)) {
      const uploaded = await uploadFileResumable({ api, file, scope: "document", headers: identity });
      form.delete("file");
      form.set("upload_id", uploaded.upload_id);
    }
  }
  return form;
}

export async function flushOfflineQueue() {
  if (!navigator.onLine) return { sent: 0, pending: await queuedRequestCount() };
  let sent = 0;
  for (const item of await allRequests()) {
    const identity = await authorizationHeaders(item);
    if (!identity) continue;
    let body;
    const requestHeaders = { ...identity, "x-idempotency-key": item.operationKey };
    if (item.payloadType === "json") {
      body = JSON.stringify(item.body || {});
      requestHeaders["content-type"] = "application/json";
    } else {
      try { body = await replayForm(item, identity); }
      catch (error) {
        item.attempts += 1;
        item.lastError = error.message || "Caricamento allegato non riuscito";
        await updateRequest(item);
        break;
      }
    }
    try {
      const response = await fetch(item.endpoint, {
        method: item.method,
        headers: requestHeaders,
        body,
      });
      if (response.ok) {
        await removeRequest(item.id);
        signalQueueChanged();
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
