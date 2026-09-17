export const SLOW_UPLOAD_NOTICE_DELAY_MS = 20_000;

export const slowUploadMessage = (subject = "il contenuto") =>
  `Il caricamento di ${subject} sta richiedendo più del previsto. Non chiudere l’app: continuerà automaticamente e puoi riprovare senza duplicati.`;

export const uploadProgressMessage = (label, progress, slow = false) =>
  `${label}: ${Math.max(0, Math.min(100, Number(progress) || 0))}%${
    slow ? " · rete lenta, il caricamento continua" : ""
  }`;
