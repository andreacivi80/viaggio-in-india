import { buildPushPayload } from "@block65/webcrypto-web-push";
import { validateFileBytes } from "../_lib/fileValidation.js";

const responseSecurityHeaders = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "SAMEORIGIN",
  "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
  "content-security-policy": "default-src 'none'; frame-ancestors 'none'",
  "permissions-policy": "camera=(self), microphone=(self), geolocation=(self)",
};
const json = (data, status = 200, additionalHeaders = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...responseSecurityHeaders,
      ...additionalHeaders,
    },
  });
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const imdStations = {
  Delhi: "42182",
  Udaipur: "42542",
  Jodhpur: "42339",
  Jaipur: "42348",
  Agra: "42259",
  Varanasi: "42479",
};
const weatherCoordinates = {
  Delhi: [28.6139, 77.209],
  Udaipur: [24.5854, 73.7125],
  Jodhpur: [26.2389, 73.0243],
  Jaipur: [26.9124, 75.7873],
  Agra: [27.1767, 78.0081],
  Varanasi: [25.3176, 82.9739],
};
const monthNumber = {
  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
};
const htmlText = (value) => String(value || "")
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;|&#160;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/\s+/g, " ")
  .trim();
async function readImdForecast(city, stationId) {
  const upstream = await fetch(`https://city.imd.gov.in/citywx/citywxnew.php?id=${stationId}`, {
    headers: { accept: "text/html", "user-agent": "India-Insieme/1.0 weather display" },
    cf: { cacheTtl: 1800, cacheEverything: true },
  });
  if (!upstream.ok) return [];
  const html = await upstream.text();
  const year = Number((html.match(/Dated\s*:\s*[A-Za-z]{3}\s+\d{1,2},\s*(\d{4})/i) || [])[1]) ||
    new Date().getUTCFullYear();
  const forecast = html.slice(Math.max(0, html.search(/7 Day(?:'s)? Forecast/i)));
  const entries = [];
  for (const row of forecast.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => htmlText(match[1]));
    const dateMatch = cells[0]?.match(/^(\d{2})-([A-Za-z]{3})$/);
    if (!dateMatch || !monthNumber[dateMatch[2]]) continue;
    const min = Number(cells[1]);
    const max = Number(cells[2]);
    if (!Number.isFinite(min) || !Number.isFinite(max)) continue;
    entries.push({
      date: `${year}-${monthNumber[dateMatch[2]]}-${dateMatch[1]}`,
      city,
      min,
      max,
      description: cells[cells.length - 1] || "",
      source: "IMD",
    });
  }
  return entries;
}
const wmoDescription = (code) => {
  if ([95, 96, 99].includes(code)) return "Temporali";
  if ([65, 67, 75, 77, 82, 86].includes(code)) return "Pioggia forte";
  if ([53, 55, 57, 61, 63, 66, 73, 80, 81, 85].includes(code)) return "Pioggia moderata";
  if ([51, 56, 71].includes(code)) return "Pioggia leggera";
  if ([1, 2].includes(code)) return "Parzialmente nuvoloso";
  if (code === 3 || [45, 48].includes(code)) return "Nuvoloso";
  return "Sereno";
};
async function readExtendedForecast(city, coordinates) {
  const target = new URL("https://api.open-meteo.com/v1/forecast");
  target.searchParams.set("latitude", String(coordinates[0]));
  target.searchParams.set("longitude", String(coordinates[1]));
  target.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset");
  target.searchParams.set("hourly", "relative_humidity_2m");
  target.searchParams.set("timezone", "Asia/Kolkata");
  target.searchParams.set("forecast_days", "16");
  const upstream = await fetch(target, {
    headers: { accept: "application/json" },
    cf: { cacheTtl: 1800, cacheEverything: true },
  });
  if (!upstream.ok) return [];
  const payload = await upstream.json();
  const daily = payload.daily || {};
  const hourly = payload.hourly || {};
  const humidityByDate = new Map();
  (hourly.time || []).forEach((time, index) => {
    const value = Number(hourly.relative_humidity_2m?.[index]);
    if (!Number.isFinite(value)) return;
    const date = String(time).slice(0, 10);
    const values = humidityByDate.get(date) || [];
    values.push(value);
    humidityByDate.set(date, values);
  });
  return (daily.time || []).map((date, index) => ({
    date,
    city,
    min: Math.round(Number(daily.temperature_2m_min?.[index])),
    max: Math.round(Number(daily.temperature_2m_max?.[index])),
    description: wmoDescription(Number(daily.weather_code?.[index])),
    rain_probability: Number.isFinite(Number(daily.precipitation_probability_max?.[index]))
      ? Math.round(Number(daily.precipitation_probability_max[index]))
      : null,
    relative_humidity: humidityByDate.has(date)
      ? Math.round(humidityByDate.get(date).reduce((sum, value) => sum + value, 0) / humidityByDate.get(date).length)
      : null,
    sunrise: String(daily.sunrise?.[index] || "").slice(11, 16) || null,
    sunset: String(daily.sunset?.[index] || "").slice(11, 16) || null,
    source: "Open-Meteo",
  })).filter((entry) => Number.isFinite(entry.min) && Number.isFinite(entry.max));
}
const groupOk = (request, env) =>
  Boolean(env.GROUP_CODE) && request.headers.get("x-group-code") === env.GROUP_CODE;
const ext = (name) =>
  (name?.split(".").pop() || "bin").replace(/[^a-z0-9]/gi, "").toLowerCase();
const normalizeStoredContentType = (contentType, fileName = "") => {
  const provided = String(contentType || "").trim().toLowerCase();
  const extension = ext(fileName);
  const generic = !provided || provided === "application/octet-stream" || provided === "binary/octet-stream";
  if (extension === "pdf" && (generic || provided === "application/pdf")) return "application/pdf";
  if (["jpg", "jpeg"].includes(extension) && generic) return "image/jpeg";
  if (extension === "png" && generic) return "image/png";
  return provided || "application/octet-stream";
};
const mediaUrl = (key) => {
  if (!key) return null;
  if (String(key).startsWith("static:")) return String(key).slice(7);
  return `/api/media/${key}`;
};
async function ensureStaticPosts(env) {
  const existing = await env.DB.prepare("SELECT id FROM posts WHERE id='weroad-predeparture'").first();
  if (existing) return;
  await env.DB.batch([
    env.DB.prepare(
      `INSERT OR IGNORE INTO posts(
        id,author_name,profile_id,day_index,visibility,text,place_name,
        media_key,media_type,media_name,media_size,created_at
      ) VALUES('weroad-predeparture','India insieme','',-1,'public',?,'',NULL,NULL,NULL,0,?)`,
    ).bind(
      "Il gruppo si sta formando: preparativi in corso, valigie quasi pronte e l’India sempre più vicina. Si parte insieme con WEROAD!",
      "2026-08-04 13:30:16",
    ),
    env.DB.prepare(
      `INSERT OR IGNORE INTO post_media(
        id,post_id,media_key,media_type,media_name,media_size,position,created_at
      ) VALUES('weroad-predeparture-photo','weroad-predeparture','static:/ui/weroad-logo.png','image/png',?,55812,0,?)`,
    ).bind("WEROAD · Preparativi per l’India", "2026-08-04 13:30:16"),
  ]);
}
const futureIso = (hours) =>
  new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
const secureToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
async function tokenHash(token) {
  const bytes = new TextEncoder().encode(String(token || ""));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
async function sessionFromRequest(request, env) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";
  if (!token) return null;
  const tokenDigest = await tokenHash(token);
  const inactivityLimit = new Date(
    Date.now() - 21 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const session = await env.DB.prepare(
    `SELECT s.profile_id,s.device_id,s.device_name,s.expires_at,s.last_used_at,p.name,p.surname,p.role
     FROM auth_sessions s
     JOIN profiles p ON p.id=s.profile_id
     WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>?
       AND COALESCE(s.last_used_at,s.created_at)>?`,
  )
    .bind(tokenDigest, now(), inactivityLimit)
    .first();
  if (session) {
    const lastUsed = Date.parse(session.last_used_at || 0);
    if (!Number.isFinite(lastUsed) || Date.now() - lastUsed > 60 * 60 * 1000)
      await env.DB.prepare(
        "UPDATE auth_sessions SET last_used_at=? WHERE token_hash=?",
      )
        .bind(now(), tokenDigest)
        .run();
  }
  return session || null;
}
function deviceNameFromRequest(request) {
  const supplied = String(request.headers.get("x-device-name") || "").trim();
  if (supplied) return supplied.slice(0, 80);
  const userAgent = String(request.headers.get("user-agent") || "");
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iPhone o iPad";
  if (/android/i.test(userAgent)) return "Telefono Android";
  if (/windows/i.test(userAgent)) return "Computer Windows";
  if (/macintosh|mac os/i.test(userAgent)) return "Computer Mac";
  return "Dispositivo";
}
async function createSession(env, profileId, deviceName = "Dispositivo") {
  const token = secureToken();
  const deviceId = id();
  const createdAt = now();
  const expiresAt = futureIso(24 * 30);
  await env.DB.prepare(
    "INSERT INTO auth_sessions(token_hash,profile_id,device_id,device_name,created_at,last_used_at,expires_at,revoked_at) VALUES(?,?,?,?,?,?,?,NULL)",
  )
    .bind(await tokenHash(token), profileId, deviceId, deviceName, createdAt, createdAt, expiresAt)
    .run();
  return { token, expires_at: expiresAt, device_id: deviceId };
}
async function guestFromRequest(request, env) {
  const token = String(request.headers.get("x-guest-token") || "").trim();
  if (!token) return null;
  return (
    (await env.DB.prepare(
      `SELECT visitor_id,display_name,expires_at
       FROM guest_sessions
       WHERE token_hash=? AND revoked_at IS NULL AND expires_at>?`,
    )
      .bind(await tokenHash(token), now())
      .first()) || null
  );
}
async function rateLimit(env, request, scope, limit, windowSeconds, actor = "") {
  const ip = String(request.headers.get("cf-connecting-ip") || "unknown");
  const actorHash = await tokenHash(`${scope}:${actor || ip}`);
  const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
  const key = actorHash;
  const checkedAt = now();
  const expiresAt = new Date(Date.now() + windowSeconds * 1000).toISOString();
  await env.DB.prepare(
    `INSERT INTO rate_limits(rate_key,scope,bucket,count,expires_at)
     VALUES(?,?,?,?,?)
     ON CONFLICT(rate_key) DO UPDATE SET
       scope=excluded.scope,
       bucket=CASE WHEN rate_limits.expires_at<=? THEN excluded.bucket ELSE rate_limits.bucket END,
       count=CASE WHEN rate_limits.expires_at<=? THEN 1 ELSE rate_limits.count+1 END,
       expires_at=CASE WHEN rate_limits.expires_at<=? THEN excluded.expires_at ELSE rate_limits.expires_at END`,
  )
    .bind(key, scope, bucket, 1, expiresAt, checkedAt, checkedAt, checkedAt)
    .run();
  const row = await env.DB.prepare(
    "SELECT count FROM rate_limits WHERE rate_key=?",
  )
    .bind(key)
    .first();
  if (Number(row?.count || 0) <= limit) return null;
  const retryAfter = Math.max(
    1,
    Math.ceil((Date.parse(expiresAt) - Date.now()) / 1000),
  );
  return json(
    { error: `Troppi tentativi. Riprova tra ${retryAfter} secondi.`, retry_after: retryAfter },
    429,
    { "retry-after": String(retryAfter) },
  );
}

async function beginIdempotentOperation(env, request, scope, actorId) {
  const key = String(request.headers.get("x-idempotency-key") || "").trim();
  if (!key) return { operationHash: "" };
  if (!/^[a-zA-Z0-9:_-]{16,160}$/.test(key))
    return { response: json({ error: "Identificativo operazione non valido" }, 400) };
  const operationHash = await tokenHash(`${scope}:${actorId}:${key}`);
  const createdAt = now();
  const expiresAt = futureIso(24);
  const inserted = await env.DB.prepare(
    `INSERT OR IGNORE INTO idempotency_operations
     (operation_hash,scope,actor_id,state,response_status,response_json,created_at,expires_at)
     VALUES(?,?,?,'processing',NULL,NULL,?,?)`,
  )
    .bind(operationHash, scope, actorId, createdAt, expiresAt)
    .run();
  if (Number(inserted?.meta?.changes || 0) > 0) return { operationHash };
  const existing = await env.DB.prepare(
    "SELECT state,response_status,response_json FROM idempotency_operations WHERE operation_hash=?",
  )
    .bind(operationHash)
    .first();
  if (existing?.state === "completed" && existing.response_json) {
    return {
      response: json(
        JSON.parse(existing.response_json),
        Number(existing.response_status || 200),
        { "idempotency-replayed": "true" },
      ),
    };
  }
  return {
    response: json(
      { error: "Operazione già in elaborazione. Riprova tra pochi secondi." },
      409,
      { "retry-after": "2" },
    ),
  };
}

async function completeIdempotentOperation(env, operationHash, payload, status = 200) {
  if (!operationHash) return;
  await env.DB.prepare(
    `UPDATE idempotency_operations
     SET state='completed',response_status=?,response_json=?
     WHERE operation_hash=?`,
  )
    .bind(status, JSON.stringify(payload), operationHash)
    .run();
}

async function abandonIdempotentOperation(env, operationHash) {
  if (!operationHash) return;
  await env.DB.prepare(
    "DELETE FROM idempotency_operations WHERE operation_hash=? AND state='processing'",
  )
    .bind(operationHash)
    .run();
}
async function claimInitialProfile(env, profileId, deviceName = "Dispositivo") {
  const token = secureToken();
  const deviceId = id();
  const tokenDigest = await tokenHash(token);
  const createdAt = now();
  const expiresAt = futureIso(24 * 30);
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO profile_device_claims(profile_id,claimed_at) VALUES(?,?)",
    ).bind(profileId, createdAt),
    env.DB.prepare(
      "INSERT INTO auth_sessions(token_hash,profile_id,device_id,device_name,created_at,last_used_at,expires_at,revoked_at) VALUES(?,?,?,?,?,?,?,NULL)",
    ).bind(tokenDigest, profileId, deviceId, deviceName, createdAt, createdAt, expiresAt),
  ]);
  return { token, expires_at: expiresAt, device_id: deviceId };
}
function canViewPost(post, session = null, guest = null) {
  const visibility = String(post?.visibility || "public");
  if (visibility === "public") return true;
  if (visibility === "family") return Boolean(session || guest);
  if (visibility === "group") return Boolean(session);
  if (visibility === "private")
    return Boolean(session && session.profile_id === post.profile_id);
  return false;
}
export function canNotifySubscriber(subscription, payload) {
  const hasProfile = Boolean(subscription.profile_id);
  const hasGuest = Boolean(subscription.guest_visitor_id);
  if (payload.author_profile_id && subscription.profile_id === payload.author_profile_id)
    return false;
  if (payload.author_guest_id && subscription.guest_visitor_id === payload.author_guest_id)
    return false;
  if (!payload.visibility || payload.visibility === "public") return true;
  if (payload.visibility === "family") return hasProfile || hasGuest;
  if (payload.visibility === "group") return hasProfile;
  if (payload.visibility === "private")
    return subscription.profile_id === payload.author_profile_id;
  return false;
}
async function notifySubscribers(env, payload) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY)
    return { configured: false, sent: 0, failed: 0, errors: ["Chiavi push mancanti"] };
  const vapid = {
    subject: "https://viaggio-in-india-2026.pages.dev/",
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
  };
  const subscriptions = await env.DB.prepare(
    "SELECT id,endpoint,p256dh,auth,profile_id,guest_visitor_id FROM push_subscriptions",
  ).all();
  const authorizedSubscriptions = subscriptions.results.filter((subscription) =>
    canNotifySubscriber(subscription, payload));
  const deliveries = await Promise.all(
    authorizedSubscriptions.map(async (subscription) => {
      try {
        const target = {
          endpoint: subscription.endpoint,
          expirationTime: null,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        };
        const request = await buildPushPayload(
          { data: JSON.stringify(payload), options: { ttl: 3600 } },
          target,
          vapid,
        );
        const response = await fetch(subscription.endpoint, request);
        if (!response.ok) {
          const error = new Error((await response.text()).slice(0, 180));
          error.statusCode = response.status;
          throw error;
        }
        return { ok: true };
      } catch (error) {
        if ([404, 410].includes(error?.statusCode))
          await env.DB.prepare("DELETE FROM push_subscriptions WHERE id=?")
            .bind(subscription.id)
            .run();
        return {
          ok: false,
          status: Number(error?.statusCode || 0),
          message: String(error?.body || error?.message || "Invio non riuscito").slice(0, 180),
        };
      }
    }),
  );
  const errors = deliveries.filter((delivery) => !delivery.ok);
  return {
    configured: true,
    sent: deliveries.length - errors.length,
    failed: errors.length,
    errors: errors.slice(0, 3).map((error) => ({
      status: error.status,
      message: error.message,
    })),
  };
}

async function saveMedia(env, file, prefix = "public") {
  if (!(file instanceof File) || file.size === 0) return null;
  const contentType = normalizeStoredContentType(file.type, file.name);
  if (
    (prefix.startsWith("public") || prefix.startsWith("restricted")) &&
    (!/^(image|video|audio)\//.test(contentType) || contentType === "image/svg+xml")
  ) {
    const error = new Error("Formato non consentito: usa foto, video o audio del telefono");
    error.status = 400;
    throw error;
  }
  const max = contentType.startsWith("video/")
    ? 25 * 1024 * 1024
    : 12 * 1024 * 1024;
  if (file.size > max) {
    const error = new Error(
      `File troppo grande: massimo ${Math.round(max / 1024 / 1024)} MB`,
    );
    error.status = 400;
    throw error;
  }
  const bytes = await file.arrayBuffer();
  validateFileBytes(bytes, contentType, file.name, prefix.startsWith("private") ? "document" : "post");
  const key = `${prefix}/${Date.now()}-${id()}.${ext(file.name)}`;
  await env.MEDIA.put(key, bytes, {
    metadata: {
      contentType,
      name: file.name || "file",
    },
  });
  return {
    key,
    type: contentType,
    name: file.name || "file",
    size: file.size,
  };
}

const UPLOAD_PART_SIZE = 4 * 1024 * 1024;
const uploadLimit = (contentType, scope) => {
  if (scope === "document") return 80 * 1024 * 1024;
  if (contentType.startsWith("video/")) return 500 * 1024 * 1024;
  return 120 * 1024 * 1024;
};
function validateUploadDescription({ contentType, fileName, fileSize, scope }) {
  if (!['post', 'document'].includes(scope)) throw Object.assign(new Error("Destinazione non valida"), { status: 400 });
  if (!Number.isInteger(fileSize) || fileSize <= 0 || fileSize > uploadLimit(contentType, scope))
    throw Object.assign(new Error("Dimensione del file non consentita"), { status: 400 });
  if (scope === "post" && (!/^(image|video|audio)\//.test(contentType) || contentType === "image/svg+xml"))
    throw Object.assign(new Error("Per il diario usa foto, video o audio"), { status: 400 });
  if (scope === "document" && /(?:html|javascript|svg|xml)/i.test(contentType))
    throw Object.assign(new Error("Formato documento non consentito"), { status: 400 });
  if (!String(fileName || "").trim()) throw Object.assign(new Error("Nome file mancante"), { status: 400 });
}
const chunkKey = (uploadId, partNumber) => `upload-chunks/${uploadId}/${partNumber}`;
async function digestHex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
export async function persistUploadPart(env, upload, partNumber, bytes, etag, timestamp = now()) {
  const key = chunkKey(upload.id, partNumber);
  await env.MEDIA.put(key, bytes, {
    metadata: { uploadId: upload.id, partNumber: String(partNumber), etag },
  });
  try {
    await env.DB.prepare(
      `INSERT INTO upload_parts(upload_session_id,part_number,part_size,etag,updated_at)
       VALUES(?,?,?,?,?) ON CONFLICT(upload_session_id,part_number)
       DO UPDATE SET part_size=excluded.part_size,etag=excluded.etag,updated_at=excluded.updated_at`,
    ).bind(upload.id, partNumber, bytes.byteLength, etag, timestamp).run();
  } catch (error) {
    // Se D1 cade dopo la scrittura KV, non lasciamo una parte orfana: il
    // caricamento resta ripetibile dal telefono quando la rete torna stabile.
    try { await env.MEDIA.delete(key); } catch { /* la manutenzione riproverà */ }
    throw error;
  }
}
async function deleteStoredMedia(env, key) {
  if (!key) return;
  if (!key.startsWith("chunked/")) {
    await env.MEDIA.delete(key);
    return;
  }
  const upload = await env.DB.prepare("SELECT id FROM upload_sessions WHERE object_key=?")
    .bind(key).first();
  if (!upload) return;
  const parts = await env.DB.prepare("SELECT part_number FROM upload_parts WHERE upload_session_id=?")
    .bind(upload.id).all();
  await Promise.all(parts.results.map((part) => env.MEDIA.delete(chunkKey(upload.id, part.part_number))));
  await env.DB.prepare("DELETE FROM upload_parts WHERE upload_session_id=?").bind(upload.id).run();
  await env.DB.prepare("DELETE FROM upload_sessions WHERE id=?").bind(upload.id).run();
}
let profileGenderSchemaReady = false;
async function ensureProfileGenderSchema(env) {
  if (profileGenderSchemaReady) return;
  try { await env.DB.prepare("ALTER TABLE profiles ADD COLUMN gender TEXT DEFAULT ''").run(); }
  catch (error) { if (!/duplicate column|already exists/i.test(String(error?.message || error))) throw error; }
  await env.DB.batch([
    env.DB.prepare("UPDATE profiles SET gender='male' WHERE lower(trim(name))='andrea' AND (gender IS NULL OR gender='')"),
    env.DB.prepare("UPDATE profiles SET gender='female' WHERE lower(trim(name))='sara' AND (gender IS NULL OR gender='')"),
    env.DB.prepare("UPDATE profiles SET gender='female' WHERE lower(trim(name))='valentina' AND (gender IS NULL OR gender='')"),
  ]);
  profileGenderSchemaReady = true;
}
async function silentMaintenance(env) {
  const markerKey = "system/last-silent-maintenance";
  const lastRun = Number(await env.MEDIA.get(markerKey, { type: "text" })) || 0;
  if (Date.now() - lastRun < 6 * 60 * 60 * 1000) return;
  await env.MEDIA.put(markerKey, String(Date.now()));
  const expiredUploads = await env.DB.prepare(
    "SELECT object_key FROM upload_sessions WHERE status!='consumed' AND expires_at<? LIMIT 25",
  ).bind(now()).all();
  for (const upload of expiredUploads.results)
    await deleteStoredMedia(env, upload.object_key);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM idempotency_operations WHERE expires_at<?").bind(now()),
    env.DB.prepare("DELETE FROM rate_limits WHERE expires_at<?").bind(now()),
    env.DB.prepare("DELETE FROM guest_sessions WHERE expires_at<? OR revoked_at IS NOT NULL").bind(now()),
    env.DB.prepare("DELETE FROM auth_sessions WHERE expires_at<? OR (revoked_at IS NOT NULL AND revoked_at<?)")
      .bind(now(), new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
  ]);
}
async function chunkedMedia(env, request, key, headers) {
  const upload = await env.DB.prepare(
    "SELECT id,content_type,file_name,file_size FROM upload_sessions WHERE object_key=? AND status IN ('completed','consumed')",
  ).bind(key).first();
  if (!upload) return new Response("Not found", { status: 404 });
  const parts = await env.DB.prepare(
    "SELECT part_number,part_size FROM upload_parts WHERE upload_session_id=? ORDER BY part_number",
  ).bind(upload.id).all();
  let start = 0;
  let end = Number(upload.file_size) - 1;
  const range = request.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    start = range[1] ? Number(range[1]) : 0;
    end = Math.min(range[2] ? Number(range[2]) : end, end);
    if (start > end || start >= Number(upload.file_size))
      return new Response(null, { status: 416, headers: { "content-range": `bytes */${upload.file_size}` } });
  }
  const servedContentType = normalizeStoredContentType(upload.content_type, upload.file_name);
  headers["content-type"] = servedContentType;
  headers["content-disposition"] = /^(image\/|video\/|audio\/|application\/pdf)/i.test(servedContentType)
    ? `inline; filename*=UTF-8''${encodeURIComponent(upload.file_name)}`
    : `attachment; filename*=UTF-8''${encodeURIComponent(upload.file_name)}`;
  headers["content-length"] = String(end - start + 1);
  if (range) headers["content-range"] = `bytes ${start}-${end}/${upload.file_size}`;
  if (request.method === "HEAD") return new Response(null, { status: range ? 206 : 200, headers });
  const stream = new ReadableStream({
    async start(controller) {
      try {
        let offset = 0;
        for (const part of parts.results) {
          const partStart = offset;
          const partEnd = offset + Number(part.part_size) - 1;
          offset = partEnd + 1;
          if (partEnd < start || partStart > end) continue;
          const bytes = await env.MEDIA.get(chunkKey(upload.id, part.part_number), { type: "arrayBuffer" });
          if (!bytes) throw new Error("Parte del file non disponibile");
          const from = Math.max(0, start - partStart);
          const to = Math.min(bytes.byteLength, end - partStart + 1);
          controller.enqueue(new Uint8Array(bytes).slice(from, to));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
  return new Response(stream, { status: range ? 206 : 200, headers });
}

async function readState(env, session = null, guest = null) {
  const [profiles, posts, comments, reactions, postMedia, syncState] = await Promise.all([
    env.DB.prepare("SELECT * FROM profiles ORDER BY created_at").all(),
    env.DB.prepare("SELECT * FROM posts ORDER BY created_at DESC").all(),
    env.DB.prepare("SELECT * FROM comments ORDER BY created_at").all(),
    env.DB.prepare(
      "SELECT post_id, kind, author_name, COUNT(*) AS total FROM reactions GROUP BY post_id, kind, author_name",
    ).all(),
    env.DB.prepare("SELECT * FROM post_media ORDER BY position").all(),
    env.DB.prepare("SELECT version,updated_at FROM sync_state WHERE id=1").first(),
  ]);
  const profileById = new Map(profiles.results.map((profile) => [profile.id, profile]));
  const publicName = (profileId, fallback) => {
    if (session) return fallback;
    const profile = profileById.get(profileId);
    if (!profile) return fallback;
    const initial = String(profile.surname || "").trim().slice(0, 1);
    return `${profile.name}${initial ? ` ${initial}.` : ""}`;
  };
  return {
    sync_version: Number(syncState?.version || 0),
    sync_updated_at: syncState?.updated_at || null,
    profiles: profiles.results.map((p) => {
      const { avatar_key: avatarKey, ...profileFields } = p;
      return session
        ? { ...profileFields, avatar_url: mediaUrl(avatarKey) }
        : {
            id: p.id,
            name: p.name,
            surname: String(p.surname || "").trim().slice(0, 1),
            origin_city: p.origin_city || "",
            role: p.role,
            avatar_url: mediaUrl(avatarKey),
            created_at: p.created_at,
            gender: p.gender || "",
          };
    }),
    posts: posts.results.filter((p) => canViewPost(p, session, guest)).map((p) => {
      const {
        profile_id: postProfileId,
        media_key: legacyMediaKey,
        ...postFields
      } = p;
      return {
      ...postFields,
      can_manage: Boolean(
        session &&
          (session.role === "coordinator" || postProfileId === session.profile_id),
      ),
      author_name: publicName(postProfileId, p.author_name),
      media_url: mediaUrl(legacyMediaKey),
      media: [
        ...(legacyMediaKey
          ? [
              {
                id: `legacy-${p.id}`,
                media_url: mediaUrl(p.media_key),
                media_type: p.media_type,
                media_name: p.media_name,
                media_size: p.media_size,
                position: 0,
              },
            ]
          : []),
        ...postMedia.results
          .filter((m) => m.post_id === p.id)
          .map((m) => ({
            id: m.id,
            media_url: mediaUrl(m.media_key),
            media_type: m.media_type,
            media_name: m.media_name,
            media_size: m.media_size,
            position: m.position,
          })),
      ],
      comments: comments.results
        .filter((c) => c.post_id === p.id)
        .map((c) => {
          const {
            profile_id: commentProfileId,
            visitor_id: commentVisitorId,
            media_key: commentMediaKey,
            ...commentFields
          } = c;
          return {
            ...commentFields,
            can_manage: Boolean(
              session
                ? session.role === "coordinator" || commentProfileId === session.profile_id
                : guest && commentVisitorId === guest.visitor_id,
            ),
            author_name: publicName(commentProfileId, c.author_name),
            media_url: mediaUrl(commentMediaKey),
          };
        }),
      reactions: reactions.results.filter((r) => r.post_id === p.id),
    };
    }),
  };
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const path = (
    Array.isArray(params.path)
      ? params.path.join("/")
      : String(params.path || "")
  ).replace(/^\/+|\/+$/g, "");
  await ensureProfileGenderSchema(env);
  context.waitUntil?.(silentMaintenance(env).catch(() => {}));
  try {
    if (request.method === "POST" && path === "auth/bootstrap") {
      const limited = await rateLimit(env, request, "auth-bootstrap", 5, 300);
      if (limited) return limited;
      if (!groupOk(request, env)) return json({ error: "Codice non corretto" }, 403);
      const body = await request.json().catch(() => ({}));
      const name = String(body.name || "").trim();
      const surname = String(body.surname || "").trim();
      const originCity = String(body.origin_city || "").trim();
      if (!name) return json({ error: "Inserisci il nome del coordinatore" }, 400);
      if (name.length > 80 || surname.length > 80 || originCity.length > 100)
        return json({ error: "I dati inseriti sono troppo lunghi" }, 400);
      const profileId = id();
      const createdAt = now();
      const inserted = await env.DB.prepare(
        `INSERT INTO profiles(id,name,surname,age,job,origin_city,bio,role,avatar_key,created_at)
         SELECT ?,?,?, '', '', ?, '', 'coordinator', NULL, ?
         WHERE NOT EXISTS (SELECT 1 FROM profiles)`,
      )
        .bind(profileId, name, surname, originCity, createdAt)
        .run();
      if (!inserted.meta?.changes)
        return json({ error: "Il gruppo è già stato inizializzato" }, 409);
      try {
        const issued = await createSession(env, profileId, deviceNameFromRequest(request));
        return json({
          ...issued,
          profile: { id: profileId, name, surname, origin_city: originCity, role: "coordinator" },
        }, 201);
      } catch (error) {
        await env.DB.prepare("DELETE FROM profiles WHERE id=?").bind(profileId).run();
        throw error;
      }
    }
    if (request.method === "POST" && path === "auth/group") {
      const limited = await rateLimit(env, request, "auth-group", 10, 60);
      if (limited) return limited;
      if (!groupOk(request, env)) return json({ error: "Codice non corretto" }, 403);
      return json({ ok: true });
    }
    if (request.method === "POST" && path === "auth/unlock") {
      const limited = await rateLimit(env, request, "auth-unlock", 10, 60);
      if (limited) return limited;
      if (!groupOk(request, env)) return json({ error: "Codice non corretto" }, 403);
      return json(
        {
          error:
            "Per collegare un profilo apri il link personale ricevuto dalla coordinatrice.",
        },
        403,
      );
    }
    if (request.method === "POST" && path === "auth/register") {
      const limited = await rateLimit(env, request, "auth-register", 8, 300);
      if (limited) return limited;
      if (!groupOk(request, env)) return json({ error: "Codice non corretto" }, 403);
      const body = await request.json().catch(() => ({}));
      const name = String(body.name || "").trim();
      const surname = String(body.surname || "").trim();
      const originCity = String(body.origin_city || "").trim();
      const role = body.role === "coordinator" ? "coordinator" : "traveler";
      const knownGender = { andrea: "male", sara: "female", valentina: "female" }[name.toLowerCase()] || "";
      const gender = ["female", "male"].includes(body.gender) ? body.gender : knownGender;
      if (!name) return json({ error: "Inserisci il tuo nome" }, 400);
      if (name.length > 80 || surname.length > 80 || originCity.length > 100)
        return json({ error: "I dati inseriti sono troppo lunghi" }, 400);
      const profileId = id();
      const createdAt = now();
      await env.DB.prepare(
        `INSERT INTO profiles(id,name,surname,age,job,origin_city,bio,role,avatar_key,created_at,gender)
         VALUES(?,?,?, '', '', ?, '', ?, NULL, ?, ?)`,
      ).bind(profileId, name, surname, originCity, role, createdAt, gender).run();
      try {
        const issued = await createSession(env, profileId, deviceNameFromRequest(request));
        return json({
          ...issued,
          profile: { id: profileId, name, surname, origin_city: originCity, role, gender },
        }, 201);
      } catch (error) {
        await env.DB.prepare("DELETE FROM profiles WHERE id=?").bind(profileId).run();
        throw error;
      }
    }
    if (request.method === "POST" && path === "auth/claim") {
      const limited = await rateLimit(env, request, "auth-claim", 20, 60);
      if (limited) return limited;
      const body = await request.json();
      const inviteHash = await tokenHash(body.invite_token);
      const invite = await env.DB.prepare(
        `SELECT i.profile_id,p.name,p.surname,p.role
         FROM profile_invites i
         JOIN profiles p ON p.id=i.profile_id
         WHERE i.token_hash=? AND i.used_at IS NULL AND i.expires_at>?`,
      )
        .bind(inviteHash, now())
        .first();
      if (!invite)
        return json({ error: "Invito non valido o scaduto" }, 403);
      const claimedAt = now();
      const claim = await env.DB.prepare(
        "UPDATE profile_invites SET used_at=? WHERE token_hash=? AND used_at IS NULL",
      )
        .bind(claimedAt, inviteHash)
        .run();
      if (!claim.meta?.changes)
        return json({ error: "Invito già utilizzato" }, 409);
      let issued;
      try {
        issued = await createSession(env, invite.profile_id, deviceNameFromRequest(request));
      } catch (error) {
        await env.DB.prepare(
          "UPDATE profile_invites SET used_at=NULL WHERE token_hash=? AND used_at=?",
        )
          .bind(inviteHash, claimedAt)
          .run();
        throw error;
      }
      return json({
        ...issued,
        profile: {
          id: invite.profile_id,
          name: invite.name,
          surname: invite.surname,
          role: invite.role,
        },
      });
    }
    if (request.method === "POST" && path === "auth/guest") {
      const limited = await rateLimit(env, request, "auth-guest", 5, 60);
      if (limited) return limited;
      const body = await request.json();
      const displayName = String(body.display_name || "").trim();
      if (!displayName || displayName.length > 80)
        return json({ error: "Inserisci un nome valido" }, 400);
      const token = secureToken();
      const visitorId = id();
      const expiresAt = futureIso(24 * 30);
      await env.DB.prepare(
        "INSERT INTO guest_sessions(token_hash,visitor_id,display_name,created_at,expires_at,revoked_at) VALUES(?,?,?,?,?,NULL)",
      )
        .bind(await tokenHash(token), visitorId, displayName, now(), expiresAt)
        .run();
      return json(
        { token, visitor_id: visitorId, display_name: displayName, expires_at: expiresAt },
        201,
      );
    }
    if (request.method === "GET" && path === "auth/session") {
      const session = await sessionFromRequest(request, env);
      if (!session) return json({ error: "Sessione non valida" }, 401);
      return json({
        profile: {
          id: session.profile_id,
          name: session.name,
          surname: session.surname,
          role: session.role,
        },
        expires_at: session.expires_at,
      });
    }
    if (request.method === "POST" && path === "auth/logout") {
      const authorization = request.headers.get("authorization") || "";
      const token = authorization.startsWith("Bearer ")
        ? authorization.slice(7).trim()
        : "";
      const session = token ? await sessionFromRequest(request, env) : null;
      let disabledPushSubscriptions = 0;
      if (token) {
        const statements = [env.DB.prepare(
          "UPDATE auth_sessions SET revoked_at=? WHERE token_hash=?",
        ).bind(now(), await tokenHash(token))];
        if (session)
          statements.push(env.DB.prepare(
            "DELETE FROM push_subscriptions WHERE profile_id=?",
          ).bind(session.profile_id));
        const results = await env.DB.batch(statements);
        disabledPushSubscriptions = Number(results[1]?.meta?.changes || 0);
      }
      return json({ ok: true, push_subscriptions_revoked: disabledPushSubscriptions });
    }
    if (request.method === "GET" && path === "auth/devices") {
      const session = await sessionFromRequest(request, env);
      if (!session) return json({ error: "Sessione non valida" }, 401);
      const devices = await env.DB.prepare(
        `SELECT device_id,device_name,created_at,last_used_at,expires_at
         FROM auth_sessions
         WHERE profile_id=? AND revoked_at IS NULL AND expires_at>?
         ORDER BY COALESCE(last_used_at,created_at) DESC`,
      )
        .bind(session.profile_id, now())
        .all();
      return json({
        devices: devices.results.map((device) => ({
          ...device,
          current: device.device_id === session.device_id,
        })),
      });
    }
    if (request.method === "DELETE" && path.startsWith("auth/devices/")) {
      const session = await sessionFromRequest(request, env);
      if (!session) return json({ error: "Sessione non valida" }, 401);
      const deviceId = path.slice("auth/devices/".length);
      const result = await env.DB.prepare(
        "UPDATE auth_sessions SET revoked_at=? WHERE device_id=? AND profile_id=? AND revoked_at IS NULL",
      )
        .bind(now(), deviceId, session.profile_id)
        .run();
      if (!result.meta?.changes) return json({ error: "Dispositivo non trovato" }, 404);
      const pushResult = await env.DB.prepare(
        "DELETE FROM push_subscriptions WHERE profile_id=?",
      ).bind(session.profile_id).run();
      return json({
        ok: true,
        current_revoked: deviceId === session.device_id,
        push_subscriptions_revoked: Number(pushResult.meta?.changes || 0),
      });
    }
    if (request.method === "POST" && path === "auth/logout-all") {
      const session = await sessionFromRequest(request, env);
      if (!session) return json({ error: "Sessione non valida" }, 401);
      const results = await env.DB.batch([
        env.DB.prepare(
          "UPDATE auth_sessions SET revoked_at=? WHERE profile_id=? AND revoked_at IS NULL",
        ).bind(now(), session.profile_id),
        env.DB.prepare(
          "DELETE FROM push_subscriptions WHERE profile_id=?",
        ).bind(session.profile_id),
      ]);
      return json({
        ok: true,
        push_subscriptions_revoked: Number(results[1]?.meta?.changes || 0),
      });
    }
    if (request.method === "POST" && path === "auth/invites") {
      const session = await sessionFromRequest(request, env);
      if (!session || session.role !== "coordinator")
        return json({ error: "Solo il coordinatore può creare inviti" }, 403);
      const body = await request.json();
      const profile = await env.DB.prepare(
        "SELECT id,name,surname,role FROM profiles WHERE id=?",
      )
        .bind(String(body.profile_id || ""))
        .first();
      if (!profile) return json({ error: "Profilo non trovato" }, 404);
      const token = secureToken();
      const expiresAt = futureIso(48);
      await env.DB.prepare(
        "INSERT INTO profile_invites(token_hash,profile_id,created_by,created_at,expires_at,used_at) VALUES(?,?,?,?,?,NULL)",
      )
        .bind(
          await tokenHash(token),
          profile.id,
          session.profile_id,
          now(),
          expiresAt,
        )
        .run();
      return json({
        invite_token: token,
        expires_at: expiresAt,
        profile,
      }, 201);
    }
    if (request.method === "GET" && path === "state") {
      await ensureStaticPosts(env);
      const session = await sessionFromRequest(request, env);
      const guest = session ? null : await guestFromRequest(request, env);
      return json(await readState(env, session, guest));
    }
    if (request.method === "GET" && path === "sync/version") {
      const state = await env.DB.prepare(
        "SELECT version,updated_at FROM sync_state WHERE id=1",
      ).first();
      return json({
        version: Number(state?.version || 0),
        updated_at: state?.updated_at || null,
      });
    }
    if (request.method === "GET" && path === "health") {
      await ensureStaticPosts(env);
      await env.DB.prepare(
        "INSERT OR IGNORE INTO sync_state(id,version,updated_at) VALUES(1,0,?)",
      )
        .bind(now())
        .run();
      const cutoff = now();
      await env.DB.batch([
        env.DB.prepare("DELETE FROM auth_sessions WHERE expires_at<=?").bind(cutoff),
        env.DB.prepare("DELETE FROM guest_sessions WHERE expires_at<=?").bind(cutoff),
        env.DB.prepare("DELETE FROM rate_limits WHERE expires_at<=?").bind(cutoff),
        env.DB.prepare("DELETE FROM idempotency_operations WHERE expires_at<=?").bind(cutoff),
        env.DB.prepare(
          "DELETE FROM profile_invites WHERE expires_at<=? OR used_at IS NOT NULL",
        ).bind(cutoff),
      ]);
      const state = await env.DB.prepare(
        "SELECT version,updated_at FROM sync_state WHERE id=1",
      ).first();
      return json({
        ok: true,
        version: Number(state?.version || 0),
        updated_at: state?.updated_at || null,
      });
    }
    if (request.method === "GET" && path === "weather") {
      const [imdSettled, extendedSettled] = await Promise.all([
        Promise.allSettled(
          Object.entries(imdStations).map(([city, station]) => readImdForecast(city, station)),
        ),
        Promise.allSettled(
          Object.entries(weatherCoordinates).map(([city, coordinates]) => readExtendedForecast(city, coordinates)),
        ),
      ]);
      const merged = new Map();
      for (const result of extendedSettled)
        if (result.status === "fulfilled")
          for (const forecast of result.value) merged.set(`${forecast.date}:${forecast.city}`, forecast);
      for (const result of imdSettled)
        if (result.status === "fulfilled")
          for (const forecast of result.value) {
            const key = `${forecast.date}:${forecast.city}`;
            merged.set(key, { ...(merged.get(key) || {}), ...forecast });
          }
      const forecasts = [...merged.values()].sort(
        (a, b) => a.date.localeCompare(b.date) || a.city.localeCompare(b.city),
      );
      return json(
        { source: "IMD con estensione Open-Meteo", timezone: "Asia/Kolkata", forecasts },
        200,
        { "cache-control": "public, max-age=900, s-maxage=1800" },
      );
    }
    if (request.method === "GET" && path === "places/search") {
      const limited = await rateLimit(env, request, "places-search", 60, 60);
      if (limited) return limited;
      const query = String(new URL(request.url).searchParams.get("q") || "").trim();
      if (query.length < 3) return json({ places: [] });
      const target = new URL("https://photon.komoot.io/api/");
      target.searchParams.set("q", query);
      target.searchParams.set("limit", "5");
      target.searchParams.set("lang", "en");
      const upstream = await fetch(target, {
        headers: { accept: "application/json" },
        cf: { cacheTtl: 86400, cacheEverything: true },
      });
      if (!upstream.ok) return json({ places: [] });
      const data = await upstream.json();
      const places = (data.features || []).map((feature) => {
        const properties = feature.properties || {};
        const coordinates = feature.geometry?.coordinates || [];
        const parts = [
          properties.name,
          properties.city || properties.district,
          properties.state,
          properties.country,
        ].filter(Boolean);
        return {
          label: [...new Set(parts)].join(", "),
          latitude: Number(coordinates[1]),
          longitude: Number(coordinates[0]),
        };
      });
      return json({ places });
    }
    if (request.method === "GET" && path === "places/reverse") {
      const limited = await rateLimit(env, request, "places-reverse", 60, 60);
      if (limited) return limited;
      const source = new URL(request.url).searchParams;
      const latitude = Number(source.get("lat"));
      const longitude = Number(source.get("lon"));
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude))
        return json({ error: "Coordinate non valide" }, 400);
      const target = new URL("https://photon.komoot.io/reverse");
      target.searchParams.set("lat", String(latitude));
      target.searchParams.set("lon", String(longitude));
      target.searchParams.set("lang", "en");
      const upstream = await fetch(target, {
        headers: { accept: "application/json" },
        cf: { cacheTtl: 86400, cacheEverything: true },
      });
      if (!upstream.ok) return json({ place: null });
      const data = await upstream.json();
      const feature = data.features?.[0];
      const properties = feature?.properties || {};
      const parts = [
        properties.name,
        properties.city || properties.district,
        properties.state,
        properties.country,
      ].filter(Boolean);
      return json({
        place: feature
          ? {
              label: [...new Set(parts)].join(", "),
              latitude,
              longitude,
            }
          : null,
      });
    }
    if (request.method === "GET" && path === "push/config")
      return json({ public_key: env.VAPID_PUBLIC_KEY || "" });
    if (request.method === "POST" && path === "push/subscribe") {
      const session = await sessionFromRequest(request, env);
      const guest = session ? null : await guestFromRequest(request, env);
      const body = await request.json();
      const subscription = body.subscription || {};
      const endpoint = String(subscription.endpoint || "");
      const p256dh = String(subscription.keys?.p256dh || "");
      const auth = String(subscription.keys?.auth || "");
      if (
        !endpoint.startsWith("https://") || endpoint.length > 2048 ||
        !p256dh || p256dh.length > 512 || !auth || auth.length > 256
      )
        return json({ error: "Iscrizione notifiche non valida" }, 400);
      const subscriptionId = await tokenHash(endpoint);
      await env.DB.prepare(
        `INSERT INTO push_subscriptions(id,endpoint,p256dh,auth,profile_id,guest_visitor_id,visitor_name,created_at,updated_at)
         VALUES(?,?,?,?,?,?,?,?,?)
         ON CONFLICT(endpoint) DO UPDATE SET p256dh=excluded.p256dh,auth=excluded.auth,profile_id=excluded.profile_id,guest_visitor_id=excluded.guest_visitor_id,visitor_name=excluded.visitor_name,updated_at=excluded.updated_at`,
      )
        .bind(
          subscriptionId,
          endpoint,
          p256dh,
          auth,
          session?.profile_id || "",
          guest?.visitor_id || "",
          session
            ? `${session.name} ${session.surname || ""}`.trim()
            : guest?.display_name || String(body.visitor_name || "Familiare").trim(),
          now(),
          now(),
        )
        .run();
      return json({ ok: true });
    }
    if (request.method === "POST" && path === "push/test") {
      if (!groupOk(request, env)) return json({ error: "Accesso negato" }, 403);
      const delivery = await notifySubscribers(env, {
        title: "India Insieme",
        body: "Notifica di prova ricevuta correttamente, anche con l’app chiusa.",
        url: "/",
        tag: `test-${Date.now()}`,
      });
      return json({ ok: delivery.sent > 0 && delivery.failed === 0, delivery });
    }
    if (request.method === "POST" && path === "uploads/init") {
      const session = await sessionFromRequest(request, env);
      if (!session) return json({ error: "Accesso personale richiesto" }, 403);
      const body = await request.json();
      const scope = String(body.scope || "post");
      const visibility = scope === "post" && ["public", "family", "group", "private"].includes(body.visibility)
        ? body.visibility : "private";
      const contentType = String(body.content_type || "application/octet-stream").toLowerCase();
      const fileName = String(body.file_name || "file").slice(0, 180);
      const fileSize = Number(body.file_size);
      validateUploadDescription({ contentType, fileName, fileSize, scope });
      const uploadId = id();
      const accessPrefix = scope === "document" ? "private" : visibility === "public" ? "public" : "restricted";
      const objectKey = `chunked/${accessPrefix}/${uploadId}.${ext(fileName)}`;
      const createdAt = now();
      await env.DB.prepare(
        `INSERT INTO upload_sessions(id,profile_id,upload_id,object_key,scope,visibility,content_type,file_name,file_size,status,created_at,expires_at)
         VALUES(?,?,?,?,?,?,?,?,?,'uploading',?,?)`,
      ).bind(uploadId, session.profile_id, uploadId, objectKey, scope, visibility, contentType, fileName, fileSize, createdAt, futureIso(48)).run();
      return json({ upload_id: uploadId, part_size: UPLOAD_PART_SIZE, uploaded_parts: [] }, 201);
    }
    const uploadStatusMatch = path.match(/^uploads\/([^/]+)$/);
    if (uploadStatusMatch && request.method === "GET") {
      const session = await sessionFromRequest(request, env);
      if (!session) return json({ error: "Accesso personale richiesto" }, 403);
      const upload = await env.DB.prepare(
        "SELECT id,profile_id,status,file_name,file_size,expires_at FROM upload_sessions WHERE id=?",
      ).bind(uploadStatusMatch[1]).first();
      if (!upload || upload.profile_id !== session.profile_id) return json({ error: "Caricamento non trovato" }, 404);
      const parts = await env.DB.prepare(
        "SELECT part_number,part_size,etag FROM upload_parts WHERE upload_session_id=? ORDER BY part_number",
      ).bind(upload.id).all();
      return json({ ...upload, part_size: UPLOAD_PART_SIZE, uploaded_parts: parts.results });
    }
    const uploadPartMatch = path.match(/^uploads\/([^/]+)\/parts\/(\d+)$/);
    if (uploadPartMatch && request.method === "PUT") {
      const session = await sessionFromRequest(request, env);
      if (!session) return json({ error: "Accesso personale richiesto" }, 403);
      const upload = await env.DB.prepare(
        "SELECT * FROM upload_sessions WHERE id=? AND status='uploading' AND expires_at>?",
      ).bind(uploadPartMatch[1], now()).first();
      if (!upload || upload.profile_id !== session.profile_id) return json({ error: "Caricamento non disponibile" }, 404);
      const partNumber = Number(uploadPartMatch[2]);
      const expectedParts = Math.ceil(Number(upload.file_size) / UPLOAD_PART_SIZE);
      if (!Number.isInteger(partNumber) || partNumber < 1 || partNumber > expectedParts)
        return json({ error: "Numero parte non valido" }, 400);
      const bytes = await request.arrayBuffer();
      const expectedSize = partNumber === expectedParts
        ? Number(upload.file_size) - UPLOAD_PART_SIZE * (expectedParts - 1)
        : UPLOAD_PART_SIZE;
      if (bytes.byteLength !== expectedSize) return json({ error: "Dimensione parte non valida" }, 400);
      if (partNumber === 1)
        validateFileBytes(bytes, upload.content_type, upload.file_name, upload.scope);
      const etag = await digestHex(bytes);
      await persistUploadPart(env, upload, partNumber, bytes, etag);
      return json({ ok: true, part_number: partNumber, etag });
    }
    const uploadCompleteMatch = path.match(/^uploads\/([^/]+)\/complete$/);
    if (uploadCompleteMatch && request.method === "POST") {
      const session = await sessionFromRequest(request, env);
      if (!session) return json({ error: "Accesso personale richiesto" }, 403);
      const upload = await env.DB.prepare("SELECT * FROM upload_sessions WHERE id=?")
        .bind(uploadCompleteMatch[1]).first();
      if (!upload || upload.profile_id !== session.profile_id) return json({ error: "Caricamento non trovato" }, 404);
      if (upload.status === "completed" || upload.status === "consumed")
        return json({ ok: true, upload_id: upload.id, media: { key: upload.object_key, type: upload.content_type, name: upload.file_name, size: upload.file_size } });
      const summary = await env.DB.prepare(
        "SELECT COUNT(*) AS total_parts,COALESCE(SUM(part_size),0) AS total_size,MIN(part_number) AS first_part,MAX(part_number) AS last_part FROM upload_parts WHERE upload_session_id=?",
      ).bind(upload.id).first();
      const expectedParts = Math.ceil(Number(upload.file_size) / UPLOAD_PART_SIZE);
      if (Number(summary.total_parts) !== expectedParts || Number(summary.total_size) !== Number(upload.file_size) || Number(summary.first_part) !== 1 || Number(summary.last_part) !== expectedParts)
        return json({ error: "Caricamento incompleto", uploaded_parts: Number(summary.total_parts), expected_parts: expectedParts }, 409);
      await env.DB.prepare("UPDATE upload_sessions SET status='completed',completed_at=? WHERE id=?")
        .bind(now(), upload.id).run();
      return json({ ok: true, upload_id: upload.id, media: { key: upload.object_key, type: upload.content_type, name: upload.file_name, size: upload.file_size } });
    }
    if (uploadStatusMatch && request.method === "DELETE") {
      const session = await sessionFromRequest(request, env);
      if (!session) return json({ error: "Accesso personale richiesto" }, 403);
      const upload = await env.DB.prepare("SELECT id,profile_id,object_key,status FROM upload_sessions WHERE id=?")
        .bind(uploadStatusMatch[1]).first();
      if (!upload || upload.profile_id !== session.profile_id || upload.status === "consumed")
        return json({ error: "Caricamento non eliminabile" }, 403);
      await deleteStoredMedia(env, upload.object_key);
      return json({ ok: true });
    }
    if (["GET", "HEAD"].includes(request.method) && path.startsWith("media/")) {
      const key = decodeURIComponent(path.slice(6));
      if (key.startsWith("private/") || key.startsWith("chunked/private/")) {
        const session = await sessionFromRequest(request, env);
        if (!session) return json({ error: "Accesso negato" }, 403);
        const document = await env.DB.prepare(
          "SELECT profile_id FROM document_status WHERE file_key=?",
        )
          .bind(key)
          .first();
        if (
          !document ||
          (session.role !== "coordinator" &&
            document.profile_id !== session.profile_id)
        )
          return json({ error: "Documento non autorizzato" }, 403);
      }
      if (key.startsWith("restricted/") || key.startsWith("chunked/restricted/")) {
        const session = await sessionFromRequest(request, env);
        const guest = session ? null : await guestFromRequest(request, env);
        const post = await env.DB.prepare(
          `SELECT p.profile_id,p.visibility
           FROM posts p
           LEFT JOIN post_media m ON m.post_id=p.id
           LEFT JOIN comments c ON c.post_id=p.id
           WHERE p.media_key=? OR m.media_key=? OR c.media_key=?
           LIMIT 1`,
        )
          .bind(key, key, key)
          .first();
        if (!post || !canViewPost(post, session, guest))
          return json({ error: "Contenuto non autorizzato" }, 403);
      }
      if (key.startsWith("chunked/")) {
        const chunkHeaders = {
          ...responseSecurityHeaders,
          "cache-control": key.startsWith("chunked/public/") ? "public, max-age=31536000, immutable" : "private, no-store",
          "accept-ranges": "bytes",
          "x-content-type-options": "nosniff",
        };
        return chunkedMedia(env, request, key, chunkHeaders);
      }
      const meta = await env.MEDIA.getWithMetadata(key, { type: "arrayBuffer" });
      if (!meta.value) return new Response("Not found", { status: 404 });
      const bytes = meta.value;
      const headers = {
        ...responseSecurityHeaders,
        "content-type": normalizeStoredContentType(meta.metadata?.contentType, meta.metadata?.name || key),
        "cache-control": key.startsWith("public/")
          ? "public, max-age=31536000, immutable"
          : "private, no-store",
        "accept-ranges": "bytes",
        "x-content-type-options": "nosniff",
      };
      const safeInline = /^(image\/(?!svg\+xml)|video\/|audio\/|application\/pdf)/i.test(
        headers["content-type"],
      );
      headers["content-disposition"] = safeInline ? "inline" : "attachment";
      if (request.method === "HEAD") {
        headers["content-length"] = String(bytes.byteLength);
        return new Response(null, { headers });
      }
      const range = request.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
      if (range) {
        const start = range[1] ? Number(range[1]) : 0;
        const end = Math.min(
          range[2] ? Number(range[2]) : bytes.byteLength - 1,
          bytes.byteLength - 1,
        );
        if (start > end || start >= bytes.byteLength)
          return new Response(null, {
            status: 416,
            headers: { "content-range": `bytes */${bytes.byteLength}` },
          });
        const chunk = bytes.slice(start, end + 1);
        headers["content-range"] = `bytes ${start}-${end}/${bytes.byteLength}`;
        headers["content-length"] = String(chunk.byteLength);
        return new Response(chunk, { status: 206, headers });
      }
      headers["content-length"] = String(bytes.byteLength);
      return new Response(bytes, { headers });
    }
    if (request.method === "POST" && path === "profiles") {
      const session = await sessionFromRequest(request, env);
      if (!session || session.role !== "coordinator")
        return json({ error: "Solo il coordinatore può creare profili" }, 403);
      const form = await request.formData();
      const name = String(form.get("name") || "").trim();
      if (!name) return json({ error: "Nome richiesto" }, 400);
      const avatar = await saveMedia(env, form.get("avatar"), "public/avatars");
      const row = {
        id: id(),
        name,
        surname: String(form.get("surname") || ""),
        age: String(form.get("age") || ""),
        job: String(form.get("job") || ""),
        origin_city: String(form.get("origin_city") || ""),
        bio: String(form.get("bio") || ""),
        role: form.get("role") === "coordinator" ? "coordinator" : "traveler",
        gender: ["female", "male"].includes(String(form.get("gender"))) ? String(form.get("gender")) : "",
        avatar_key: avatar?.key || null,
        created_at: now(),
      };
      await env.DB.prepare(
        "INSERT INTO profiles(id,name,surname,age,job,origin_city,bio,role,avatar_key,created_at,gender) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
      )
        .bind(
          row.id,
          row.name,
          row.surname,
          row.age,
          row.job,
          row.origin_city,
          row.bio,
          row.role,
          row.avatar_key,
          row.created_at,
          row.gender,
        )
        .run();
      return json({ ...row, avatar_url: mediaUrl(row.avatar_key) }, 201);
    }
    if (request.method === "PUT" && path.startsWith("profiles/")) {
      const profileId = path.slice(9);
      const session = await sessionFromRequest(request, env);
      if (
        !session ||
        (session.role !== "coordinator" && session.profile_id !== profileId)
      )
        return json({ error: "Non puoi modificare questo profilo" }, 403);
      const current = await env.DB.prepare(
        "SELECT * FROM profiles WHERE id=?",
      )
        .bind(profileId)
        .first();
      if (!current) return json({ error: "Viaggiatore non trovato" }, 404);
      const form = await request.formData();
      const name = String(form.get("name") || "").trim();
      if (!name) return json({ error: "Nome richiesto" }, 400);
      const avatar = await saveMedia(env, form.get("avatar"), "public/avatars");
      const avatarKey = avatar?.key || current.avatar_key || null;
      const updatedRole =
        session.role === "coordinator"
          ? form.get("role") === "coordinator"
            ? "coordinator"
            : "traveler"
          : current.role;
      try {
        await env.DB.prepare(
          "UPDATE profiles SET name=?,surname=?,age=?,job=?,origin_city=?,bio=?,role=?,avatar_key=?,gender=? WHERE id=?",
        )
          .bind(
            name,
            String(form.get("surname") || ""),
            String(form.get("age") || ""),
            String(form.get("job") || ""),
            String(form.get("origin_city") || ""),
            String(form.get("bio") || ""),
            updatedRole,
            avatarKey,
            ["female", "male"].includes(String(form.get("gender"))) ? String(form.get("gender")) : "",
            profileId,
          )
          .run();
      } catch (error) {
        if (avatar?.key) await deleteStoredMedia(env, avatar.key);
        throw error;
      }
      if (avatar?.key && current.avatar_key)
        await deleteStoredMedia(env, current.avatar_key);
      return json({ ok: true, id: profileId, avatar_url: mediaUrl(avatarKey) });
    }
    if (request.method === "POST" && path === "posts") {
      const session = await sessionFromRequest(request, env);
      if (!session)
        return json({ error: "Accesso personale richiesto" }, 403);
      const form = await request.formData();
      const files = form
        .getAll("files")
        .concat(form.get("file") ? [form.get("file")] : [])
        .filter((file) => file instanceof File && file.size > 0);
      let uploadIds;
      try {
        uploadIds = JSON.parse(String(form.get("upload_ids") || "[]"));
      } catch {
        return json({ error: "Elenco caricamenti non valido" }, 400);
      }
      if (!Array.isArray(uploadIds)) return json({ error: "Elenco caricamenti non valido" }, 400);
      uploadIds = [...new Set(uploadIds.map(String).filter(Boolean))];
      if (files.length + uploadIds.length > 10)
        return json(
          {
            error: `Puoi caricare massimo 10 contenuti per volta. Hai selezionato ${files.length + uploadIds.length} elementi.`,
          },
          400,
        );
      const savedMedia = [];
      const requestedVisibility = String(form.get("visibility") || "public");
      if (!["public", "family", "group", "private"].includes(requestedVisibility))
        return json({ error: "Visibilità non valida" }, 400);
      const uploadedMedia = [];
      for (const uploadId of uploadIds) {
        const upload = await env.DB.prepare(
          `SELECT id,object_key,content_type,file_name,file_size FROM upload_sessions
           WHERE id=? AND profile_id=? AND scope='post' AND visibility=? AND status='completed' AND consumed_at IS NULL AND expires_at>?`,
        ).bind(uploadId, session.profile_id, requestedVisibility, now()).first();
        if (!upload) return json({ error: "Caricamento grande non valido o già utilizzato" }, 409);
        uploadedMedia.push({ uploadId: upload.id, key: upload.object_key, type: upload.content_type, name: upload.file_name, size: upload.file_size });
      }
      const row = {
        id: id(),
        author_name: `${session.name} ${session.surname || ""}`.trim(),
        profile_id: session.profile_id,
        day_index: Number(form.get("day_index") || 0),
        visibility: requestedVisibility,
        text: String(form.get("text") || ""),
        place_name: String(form.get("place_name") || "").trim(),
        latitude: form.get("latitude") ? Number(form.get("latitude")) : null,
        longitude: form.get("longitude") ? Number(form.get("longitude")) : null,
        created_at: now(),
      };
      if (
        (row.latitude !== null &&
          (!Number.isFinite(row.latitude) || row.latitude < -90 || row.latitude > 90)) ||
        (row.longitude !== null &&
          (!Number.isFinite(row.longitude) || row.longitude < -180 || row.longitude > 180))
      )
        return json({ error: "Posizione non valida" }, 400);
      const operation = await beginIdempotentOperation(
        env,
        request,
        "create-post",
        session.profile_id,
      );
      if (operation.response) return operation.response;
      try {
        const mediaPrefix = row.visibility === "public"
          ? "public"
          : `restricted/${row.id}`;
        for (const file of files)
          savedMedia.push(await saveMedia(env, file, mediaPrefix));
        savedMedia.push(...uploadedMedia);
        await env.DB.prepare(
          "INSERT INTO posts(id,author_name,profile_id,day_index,visibility,text,place_name,latitude,longitude,media_key,media_type,media_name,media_size,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        )
          .bind(
            row.id,
            row.author_name,
            row.profile_id,
            row.day_index,
            row.visibility,
            row.text,
            row.place_name,
            Number.isFinite(row.latitude) ? row.latitude : null,
            Number.isFinite(row.longitude) ? row.longitude : null,
            null,
            null,
            null,
            0,
            row.created_at,
          )
          .run();
        if (savedMedia.length) {
          await env.DB.batch(
            savedMedia.map((media, position) =>
              env.DB.prepare(
                "INSERT INTO post_media(id,post_id,media_key,media_type,media_name,media_size,position,created_at) VALUES(?,?,?,?,?,?,?,?)",
              ).bind(
                id(),
                row.id,
                media.key,
                media.type,
                media.name,
                media.size,
                position,
                row.created_at,
              ),
            ),
          );
        }
        if (uploadedMedia.length)
          await env.DB.batch(uploadedMedia.map((media) =>
            env.DB.prepare("UPDATE upload_sessions SET status='consumed',consumed_at=? WHERE id=? AND status='completed'")
              .bind(row.created_at, media.uploadId),
          ));
      } catch (error) {
        await Promise.all(savedMedia.filter((media) => !media.uploadId).map((media) => deleteStoredMedia(env, media.key)));
        await env.DB.prepare("DELETE FROM post_media WHERE post_id=?").bind(row.id).run();
        await env.DB.prepare("DELETE FROM posts WHERE id=?").bind(row.id).run();
        await abandonIdempotentOperation(env, operation.operationHash);
        throw error;
      }
      if (request.headers.get("x-qa-silent") !== "true")
        context.waitUntil?.(
          notifySubscribers(env, {
          title: row.author_name,
          body: row.text || "Ha pubblicato un nuovo ricordo del viaggio.",
          url: `/?post=${encodeURIComponent(row.id)}`,
          tag: `post-${row.id}`,
          visibility: row.visibility,
          author_profile_id: row.profile_id,
          }),
        );
      const payload = {
        ...row,
        media: savedMedia.map((media, position) => ({
          ...media,
          position,
          media_url: mediaUrl(media.key),
        })),
      };
      await completeIdempotentOperation(env, operation.operationHash, payload, 201);
      return json(payload, 201);
    }
    if (request.method === "DELETE" && path.startsWith("posts/")) {
      const session = await sessionFromRequest(request, env);
      if (!session) return json({ error: "Accesso personale richiesto" }, 403);
      const postId = path.slice(6);
      const p = await env.DB.prepare(
        "SELECT media_key,profile_id FROM posts WHERE id=?",
      )
        .bind(postId)
        .first();
      if (!p) return json({ error: "Contenuto non trovato" }, 404);
      if (session.role !== "coordinator" && p.profile_id !== session.profile_id)
        return json({ error: "Non puoi eliminare questo contenuto" }, 403);
      if (p?.media_key) await deleteStoredMedia(env, p.media_key);
      const mediaRows = await env.DB.prepare(
        "SELECT media_key FROM post_media WHERE post_id=?",
      )
        .bind(postId)
        .all();
      await Promise.all(mediaRows.results.map((m) => deleteStoredMedia(env, m.media_key)));
      const commentMediaRows = await env.DB.prepare(
        "SELECT media_key FROM comments WHERE post_id=? AND media_key IS NOT NULL",
      )
        .bind(postId)
        .all();
      await Promise.all(
        commentMediaRows.results.map((media) => deleteStoredMedia(env, media.media_key)),
      );
      await env.DB.batch([
        env.DB.prepare("DELETE FROM post_media WHERE post_id=?").bind(postId),
        env.DB.prepare("DELETE FROM comments WHERE post_id=?").bind(postId),
        env.DB.prepare("DELETE FROM reactions WHERE post_id=?").bind(postId),
        env.DB.prepare("DELETE FROM posts WHERE id=?").bind(postId),
      ]);
      return json({ ok: true });
    }
    if (request.method === "POST" && path === "comments") {
      const session = await sessionFromRequest(request, env);
      const guest = session ? null : await guestFromRequest(request, env);
      if (!session && !guest)
        return json({ error: "Identità ospite richiesta" }, 401);
      const limited = await rateLimit(
        env,
        request,
        "comments",
        10,
        60,
        session?.profile_id || guest?.visitor_id,
      );
      if (limited) return limited;
      const form = await request.formData();
      const author = session
        ? `${session.name} ${session.surname || ""}`.trim()
        : guest.display_name;
      const postId = String(form.get("post_id") || "");
      if (!postId) return json({ error: "Contenuto non valido" }, 400);
      const targetPost = await env.DB.prepare(
        "SELECT id,profile_id,visibility FROM posts WHERE id=?",
      )
        .bind(postId)
        .first();
      if (!targetPost) return json({ error: "Contenuto non trovato" }, 404);
      if (!canViewPost(targetPost, session, guest))
        return json({ error: "Contenuto non autorizzato" }, 403);
      const commentText = String(form.get("text") || "");
      const commentFile = form.get("file");
      if (
        !commentText.trim() &&
        (!(commentFile instanceof File) || commentFile.size === 0)
      )
        return json({ error: "Commento vuoto" }, 400);
      const operation = await beginIdempotentOperation(
        env,
        request,
        "create-comment",
        session?.profile_id || guest.visitor_id,
      );
      if (operation.response) return operation.response;
      const commentPrefix = targetPost.visibility === "public"
        ? "public/comments"
        : `restricted/${targetPost.id}/comments`;
      let media;
      try {
        media = await saveMedia(env, commentFile, commentPrefix);
      } catch (error) {
        await abandonIdempotentOperation(env, operation.operationHash);
        throw error;
      }
      const row = {
        id: id(),
        post_id: postId,
        author_name: author,
        profile_id: session?.profile_id || "",
        text: commentText,
        created_at: now(),
      };
      try {
        await env.DB.prepare(
          "INSERT INTO comments(id,post_id,author_name,profile_id,visitor_id,text,media_key,media_type,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
        )
          .bind(
            row.id,
            row.post_id,
            row.author_name,
            row.profile_id,
            guest?.visitor_id || "",
            row.text,
            media?.key || null,
            media?.type || null,
            row.created_at,
          )
          .run();
      } catch (error) {
        if (media?.key) await deleteStoredMedia(env, media.key);
        await abandonIdempotentOperation(env, operation.operationHash);
        throw error;
      }
      if (request.headers.get("x-qa-silent") !== "true")
        context.waitUntil?.(
          notifySubscribers(env, {
          title: row.author_name,
          body: row.text || "Ha aggiunto un commento.",
          url: `/?post=${encodeURIComponent(row.post_id)}&comment=${encodeURIComponent(row.id)}`,
          tag: `comment-${row.id}`,
          visibility: targetPost.visibility,
          author_profile_id: row.profile_id,
          author_guest_id: guest?.visitor_id || "",
          }),
        );
      const payload = { ...row, media_url: mediaUrl(media?.key) };
      await completeIdempotentOperation(env, operation.operationHash, payload, 201);
      return json(payload, 201);
    }
    if (request.method === "PUT" && path.startsWith("comments/")) {
      const commentId = path.slice(9);
      const body = await request.json();
      const session = await sessionFromRequest(request, env);
      const guest = session ? null : await guestFromRequest(request, env);
      const existing = await env.DB.prepare(
        "SELECT visitor_id,profile_id FROM comments WHERE id=?",
      )
        .bind(commentId)
        .first();
      if (!existing) return json({ error: "Commento non trovato" }, 404);
      const ownsComment = session
        ? session.role === "coordinator" || existing.profile_id === session.profile_id
        : guest && existing.visitor_id === guest.visitor_id;
      if (!ownsComment)
        return json({ error: "Non puoi modificare questo commento" }, 403);
      const text = String(body.text || "").trim();
      if (!text) return json({ error: "Il commento non può essere vuoto" }, 400);
      await env.DB.prepare("UPDATE comments SET text=? WHERE id=?")
        .bind(text, commentId)
        .run();
      return json({ ok: true });
    }
    if (request.method === "DELETE" && path.startsWith("comments/")) {
      const commentId = path.slice(9);
      const body = await request.json().catch(() => ({}));
      const session = await sessionFromRequest(request, env);
      const guest = session ? null : await guestFromRequest(request, env);
      const existing = await env.DB.prepare(
        "SELECT visitor_id,profile_id,media_key FROM comments WHERE id=?",
      )
        .bind(commentId)
        .first();
      if (!existing) return json({ error: "Commento non trovato" }, 404);
      const ownsComment = session
        ? session.role === "coordinator" || existing.profile_id === session.profile_id
        : guest && existing.visitor_id === guest.visitor_id;
      if (!ownsComment)
        return json({ error: "Non puoi eliminare questo commento" }, 403);
      await env.DB.prepare("DELETE FROM comments WHERE id=?").bind(commentId).run();
      if (existing.media_key) await deleteStoredMedia(env, existing.media_key);
      return json({ ok: true });
    }
    if (request.method === "POST" && path === "reactions") {
      const session = await sessionFromRequest(request, env);
      const guest = session ? null : await guestFromRequest(request, env);
      if (!session && !guest)
        return json({ error: "Identità ospite richiesta" }, 401);
      const b = await request.json();
      if (!String(b.post_id || ""))
        return json({ error: "Reazione non valida" }, 400);
      const visitorId = session?.profile_id || guest.visitor_id;
      const authorName = session
        ? `${session.name} ${session.surname || ""}`.trim()
        : guest.display_name;
      const limited = await rateLimit(
        env,
        request,
        "reactions",
        30,
        60,
        visitorId,
      );
      if (limited) return limited;
      const targetPost = await env.DB.prepare(
        "SELECT id,profile_id,visibility FROM posts WHERE id=?",
      )
        .bind(String(b.post_id))
        .first();
      if (!targetPost) return json({ error: "Contenuto non trovato" }, 404);
      if (!canViewPost(targetPost, session, guest))
        return json({ error: "Contenuto non autorizzato" }, 403);
      const kind = ["like", "heart", "laugh", "wow", "clap", "fire"].includes(
        b.kind,
      )
        ? b.kind
        : "heart";
      const operation = await beginIdempotentOperation(
        env,
        request,
        "toggle-reaction",
        visitorId,
      );
      if (operation.response) return operation.response;
      const existing = await env.DB.prepare(
        "SELECT kind FROM reactions WHERE post_id=? AND visitor_id=? LIMIT 1",
      )
        .bind(b.post_id, visitorId)
        .first();
      await env.DB.prepare(
        "DELETE FROM reactions WHERE post_id=? AND visitor_id=?",
      )
        .bind(b.post_id, visitorId)
        .run();
      if (existing?.kind === kind) {
        const payload = { ok: true, reaction: null };
        await completeIdempotentOperation(env, operation.operationHash, payload);
        return json(payload);
      }
      try {
        await env.DB.prepare(
          "INSERT INTO reactions(id,post_id,visitor_id,author_name,kind,created_at) VALUES(?,?,?,?,?,?)",
        )
          .bind(
            id(),
            b.post_id,
            visitorId,
            authorName,
            kind,
            now(),
          )
          .run();
      } catch (error) {
        await abandonIdempotentOperation(env, operation.operationHash);
        throw error;
      }
      const payload = { ok: true, reaction: kind };
      await completeIdempotentOperation(env, operation.operationHash, payload);
      return json(payload);
    }
    if (path === "private" && request.method === "GET") {
      const session = await sessionFromRequest(request, env);
      if (!session) return json({ error: "Accesso personale richiesto" }, 401);
      const [docs, locations] = await Promise.all([
        session.role === "coordinator"
          ? env.DB.prepare("SELECT * FROM document_status").all()
          : env.DB.prepare(
              "SELECT * FROM document_status WHERE profile_id=?",
            )
              .bind(session.profile_id)
              .all(),
        env.DB.prepare(
          "SELECT * FROM locations ORDER BY updated_at DESC",
        ).all(),
      ]);
      return json({
        documents: docs.results,
        locations: locations.results,
        viewer: {
          profile_id: session.profile_id,
          role: session.role,
        },
      });
    }
    if (path === "locations" && request.method === "POST") {
      const session = await sessionFromRequest(request, env);
      if (!session) return json({ error: "Accesso personale richiesto" }, 401);
      const b = await request.json();
      const latitude = Number(b.latitude);
      const longitude = Number(b.longitude);
      if (
        !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180
      )
        return json({ error: "Posizione non valida" }, 400);
      if (String(b.profile_id || "") !== session.profile_id)
        return json({ error: "Puoi aggiornare soltanto la tua posizione" }, 403);
      const safeDisplayName = `${session.name || ""} ${session.surname || ""}`.trim() || "Viaggiatore";
      await env.DB.prepare(
        "INSERT INTO locations(profile_id,display_name,latitude,longitude,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(profile_id) DO UPDATE SET display_name=excluded.display_name,latitude=excluded.latitude,longitude=excluded.longitude,updated_at=excluded.updated_at",
      )
        .bind(
          b.profile_id,
          safeDisplayName,
          latitude,
          longitude,
          now(),
        )
        .run();
      return json({ ok: true });
    }
    if (path.startsWith("locations/") && request.method === "DELETE") {
      const profileId = path.slice(10);
      const session = await sessionFromRequest(request, env);
      if (!session || session.profile_id !== profileId)
        return json({ error: "Non puoi cancellare questa posizione" }, 403);
      await env.DB.prepare("DELETE FROM locations WHERE profile_id=?")
        .bind(profileId)
        .run();
      return json({ ok: true });
    }
    if (path === "documents" && request.method === "POST") {
      const form = await request.formData();
      const profileId = String(form.get("profile_id"));
      const session = await sessionFromRequest(request, env);
      const submittedFile = form.get("file");
      const requestsFileChange =
        (submittedFile instanceof File && submittedFile.size > 0) ||
        Boolean(String(form.get("upload_id") || ""));
      const ownsDocument = session?.profile_id === profileId;
      const coordinatorVerificationOnly =
        session?.role === "coordinator" && !requestsFileChange;
      if (
        !session ||
        (!ownsDocument && !coordinatorVerificationOnly)
      )
        return json({ error: "Documento non autorizzato" }, 403);
      const type = String(form.get("doc_type"));
      if (!["passport", "visa", "tickets", "insurance"].includes(type) && !/^other-[a-f0-9-]{36}$/.test(type))
        return json({ error: "Tipo documento non valido" }, 400);
      const operation = await beginIdempotentOperation(
        env,
        request,
        `upload-document-${type}`,
        session.profile_id,
      );
      if (operation.response) return operation.response;
      let media;
      try {
        const uploadId = String(form.get("upload_id") || "");
        if (uploadId) {
          const upload = await env.DB.prepare(
            `SELECT id,object_key,content_type,file_name,file_size FROM upload_sessions
             WHERE id=? AND profile_id=? AND scope='document' AND status='completed' AND consumed_at IS NULL AND expires_at>?`,
          ).bind(uploadId, session.profile_id, now()).first();
          if (!upload) throw Object.assign(new Error("Caricamento documento non valido o già utilizzato"), { status: 409 });
          media = { uploadId: upload.id, key: upload.object_key, type: upload.content_type, name: upload.file_name, size: upload.file_size };
        } else media = await saveMedia(env, form.get("file"), "private");
      } catch (error) {
        await abandonIdempotentOperation(env, operation.operationHash);
        throw error;
      }
      const status = media
        ? "uploaded"
        : String(form.get("status") || "missing");
      let previous;
      try {
        // La lettura della versione precedente e la sostituzione devono stare
        // nello stesso batch D1: due telefoni concorrenti vedono così una
        // sequenza ordinata e ciascuno elimina soltanto il file che ha davvero
        // sostituito, senza lasciare oggetti privati orfani in MEDIA.
        const statements = [
          env.DB.prepare(
            "SELECT file_key FROM document_status WHERE profile_id=? AND doc_type=?",
          ).bind(profileId, type),
          env.DB.prepare(
            "INSERT INTO document_status(profile_id,doc_type,file_key,file_name,status,verified_by,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(profile_id,doc_type) DO UPDATE SET file_key=COALESCE(excluded.file_key,document_status.file_key),file_name=COALESCE(excluded.file_name,document_status.file_name),status=excluded.status,verified_by=excluded.verified_by,updated_at=excluded.updated_at",
          ).bind(
            profileId,
            type,
            media?.key || null,
            media?.name || null,
            status,
            String(form.get("verified_by") || ""),
            now(),
          ),
        ];
        if (media?.uploadId)
          statements.push(
            env.DB.prepare("UPDATE upload_sessions SET status='consumed',consumed_at=? WHERE id=? AND status='completed'")
              .bind(now(), media.uploadId),
          );
        const [previousResult] = await env.DB.batch(statements);
        previous = previousResult?.results?.[0];
      } catch (error) {
        if (media?.key && !media.uploadId) await deleteStoredMedia(env, media.key);
        await abandonIdempotentOperation(env, operation.operationHash);
        throw error;
      }
      if (media?.key && previous?.file_key && previous.file_key !== media.key)
        await deleteStoredMedia(env, previous.file_key);
      const payload = { ok: true, profile_id: profileId, doc_type: type };
      await completeIdempotentOperation(env, operation.operationHash, payload);
      return json(payload);
    }
    if (path.startsWith("documents/") && request.method === "DELETE") {
      const [, profileId, type] = path.split("/");
      const session = await sessionFromRequest(request, env);
      if (!session || session.profile_id !== profileId)
        return json({ error: "Documento non autorizzato" }, 403);
      const doc = await env.DB.prepare(
        "SELECT file_key FROM document_status WHERE profile_id=? AND doc_type=?",
      )
        .bind(profileId, type)
        .first();
      if (doc?.file_key) await deleteStoredMedia(env, doc.file_key);
      await env.DB.prepare(
        "DELETE FROM document_status WHERE profile_id=? AND doc_type=?",
      )
        .bind(profileId, type)
        .run();
      return json({ ok: true });
    }
    return json({ error: "Endpoint non trovato" }, 404);
  } catch (error) {
    return json({ error: error.message || "Errore server" }, error.status || 500);
  }
}
