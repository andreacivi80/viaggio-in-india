export function syncStatusLabel(lastSyncedAt, online = true) {
  const timestamp = Number(lastSyncedAt || 0);
  if (!timestamp) return online ? "Sync in attesa" : "Offline · mai sincronizzato";
  const time = new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
  return online ? `Sync ${time}` : `Offline · sync ${time}`;
}
