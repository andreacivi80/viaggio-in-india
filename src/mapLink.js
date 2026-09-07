export function buildMapShareUrl(href, selectedDay) {
  const current = new URL(href);
  const url = new URL(current.pathname || "/", current.origin);
  url.searchParams.set("view", "map");
  if (Number.isInteger(selectedDay) && selectedDay >= 0)
    url.searchParams.set("day", String(selectedDay + 1).padStart(2, "0"));
  return url.href;
}

export function buildGoogleMapsDirectionsUrl(day) {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  if (day) {
    url.searchParams.set("origin", `${day.from}, Thailand`);
    url.searchParams.set("destination", `${day.to}, Thailand`);
  } else {
    url.searchParams.set("origin", "Bangkok, Thailand");
    url.searchParams.set("destination", "Bangkok, Thailand");
    url.searchParams.set(
      "waypoints",
      "Hua Hin, Thailand|Chumphon, Thailand|Khao Sok, Thailand|Cheow Lan Lake, Thailand|Phi Phi Islands, Thailand|Krabi, Thailand",
    );
  }
  return url.href;
}
