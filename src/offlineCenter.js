const OFFLINE_CACHE_PREFIX = "thailandia-insieme-";
const PUBLIC_COPY_KEYS = ["india-posts", "india-people"];

export function networkDescription(connection, online = true) {
  if (!online) return "Offline";
  const effectiveType = String(connection?.effectiveType || "").toUpperCase();
  const kind = String(connection?.type || "").toLowerCase();
  const label = effectiveType || (kind === "wifi" ? "Wi-Fi" : kind === "cellular" ? "Rete mobile" : "Rete online");
  return connection?.saveData ? `${label} · risparmio dati` : label;
}

export async function inspectOfflineReadiness(cacheStorage = globalThis.caches) {
  if (!cacheStorage?.keys) return { ready: false, cacheCount: 0 };
  const keys = await cacheStorage.keys();
  const matching = keys.filter((key) => key.startsWith(OFFLINE_CACHE_PREFIX));
  return { ready: matching.length > 0, cacheCount: matching.length };
}

export async function clearOfflineCopies({
  cacheStorage = globalThis.caches,
  storage = globalThis.localStorage,
} = {}) {
  const keys = cacheStorage?.keys ? await cacheStorage.keys() : [];
  const matching = keys.filter((key) => key.startsWith(OFFLINE_CACHE_PREFIX));
  await Promise.all(matching.map((key) => cacheStorage.delete(key)));
  PUBLIC_COPY_KEYS.forEach((key) => storage?.removeItem?.(key));
  return { deletedCaches: matching.length };
}
