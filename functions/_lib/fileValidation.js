const starts = (bytes, signature, offset = 0) =>
  signature.every((value, index) => bytes[offset + index] === value);
const ascii = (bytes, start, length) =>
  String.fromCharCode(...bytes.slice(start, start + length));

export function validateFileBytes(input, contentType, fileName = "file", scope = "post") {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const type = String(contentType || "application/octet-stream").toLowerCase();
  const name = String(fileName || "file").toLowerCase();
  if (/\.(?:svg|html?|xhtml|js|mjs|exe|dll|bat|cmd|com|apk)$/i.test(name))
    throw Object.assign(new Error("Formato potenzialmente pericoloso non consentito"), { status: 400 });
  const prefix = new TextDecoder().decode(bytes.slice(0, 512)).trimStart().toLowerCase();
  if (/^(?:<\?xml|<svg|<!doctype\s+html|<html|<script)/.test(prefix) || starts(bytes, [0x4d, 0x5a]))
    throw Object.assign(new Error("Il contenuto del file non corrisponde a un formato sicuro"), { status: 400 });
  const checks = [
    [/^image\/jpe?g$/, () => starts(bytes, [0xff, 0xd8, 0xff])],
    [/^image\/png$/, () => starts(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    [/^image\/gif$/, () => ascii(bytes, 0, 4) === "GIF8"],
    [/^image\/webp$/, () => ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP"],
    [/^image\/(?:heic|heif)$/, () => ascii(bytes, 4, 4) === "ftyp" && /^(?:heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(ascii(bytes, 8, 4))],
    [/^application\/pdf$/, () => ascii(bytes, 0, 5) === "%PDF-"],
    [/^(?:video\/(?:mp4|quicktime)|audio\/(?:mp4|x-m4a))$/, () => ascii(bytes, 4, 4) === "ftyp"],
    [/^audio\/mpeg$/, () => ascii(bytes, 0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)],
    [/^audio\/(?:wav|x-wav)$/, () => ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WAVE"],
    [/^(?:audio|video)\/ogg$/, () => ascii(bytes, 0, 4) === "OggS"],
    [/^video\/webm$/, () => starts(bytes, [0x1a, 0x45, 0xdf, 0xa3])],
  ];
  const matched = checks.find(([pattern]) => pattern.test(type));
  if (matched && !matched[1]())
    throw Object.assign(new Error("Il contenuto non corrisponde al formato dichiarato"), { status: 400 });
  if (scope === "post" && !/^(image|video|audio)\//.test(type))
    throw Object.assign(new Error("Per il diario usa foto, video o audio"), { status: 400 });
  return true;
}
