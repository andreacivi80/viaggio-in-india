const QA_HOST = "viaggio-in-india-2026-qa.pages.dev";

export function isSafeMutationTarget(value) {
  if (!value) return false;
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  return ["127.0.0.1", "localhost"].includes(url.hostname)
    || url.hostname === QA_HOST
    || url.hostname.endsWith(`.${QA_HOST}`);
}

export function requireSafeMutationTarget(value) {
  if (!isSafeMutationTarget(value)) {
    throw new Error("Test con scritture bloccato: usare esclusivamente localhost o il dominio QA");
  }
}
