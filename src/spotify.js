export const spotifyLink = (value = "") => {
  const match = String(value).trim().match(
    /https?:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/i,
  );
  if (!match) return null;
  const [, type, id] = match;
  const url = `https://open.spotify.com/${type.toLowerCase()}/${id}`;
  return {
    url,
    embedUrl: `https://open.spotify.com/embed/${type.toLowerCase()}/${id}?utm_source=generator`,
  };
};

export const splitSpotifyCaption = (value = "") => {
  const spotify = spotifyLink(value);
  if (!spotify) return { caption: value, spotify: null };
  return {
    caption: String(value).replace(/https?:\/\/open\.spotify\.com\/[^\s]+/i, "").trim(),
    spotify,
  };
};
