// La sincronizzazione riparte subito su apertura, ritorno in primo piano e
// ritorno online. Questi intervalli limitano soltanto i controlli ripetitivi.
export const SESSION_VERIFICATION_INTERVAL_MS = 60_000;
export const AUTHENTICATED_SYNC_INTERVAL_MS = 7_500;
export const PUBLIC_SYNC_INTERVAL_MS = 15_000;
export const PRIVATE_SYNC_INTERVAL_MS = 10_000;
