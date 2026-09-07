export function buildMapShareUrl(href, selectedDay) {
  const current = new URL(href);
  const url = new URL(current.pathname || "/", current.origin);
  url.searchParams.set("view", "map");
  if (Number.isInteger(selectedDay) && selectedDay >= 0)
    url.searchParams.set("day", String(selectedDay + 1).padStart(2, "0"));
  return url.href;
}
