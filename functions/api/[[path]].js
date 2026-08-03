import { buildPushPayload } from "@block65/webcrypto-web-push";

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
const groupOk = (request, env) =>
  Boolean(env.GROUP_CODE) && request.headers.get("x-group-code") === env.GROUP_CODE;
const ext = (name) =>
  (name?.split(".").pop() || "bin").replace(/[^a-z0-9]/gi, "").toLowerCase();
const mediaUrl = (key) => (key ? `/api/media/${key}` : null);
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
  const key = `${actorHash}:${bucket}`;
  const expiresAt = new Date((bucket + 1) * windowSeconds * 1000).toISOString();
  await env.DB.prepare(
    `INSERT INTO rate_limits(rate_key,scope,bucket,count,expires_at)
     VALUES(?,?,?,?,?)
     ON CONFLICT(rate_key) DO UPDATE SET count=count+1`,
  )
    .bind(key, scope, bucket, 1, expiresAt)
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
  const authorizedSubscriptions = subscriptions.results.filter((subscription) => {
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
  });
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
  const contentType = String(file.type || "application/octet-stream").toLowerCase();
  if (
    (prefix.startsWith("public") || prefix.startsWith("restricted")) &&
    (!/^(image|video|audio)\//.test(contentType) || contentType === "image/svg+xml")
  ) {
    const error = new Error("Formato non consentito: usa foto, video o audio del telefono");
    error.status = 400;
    throw error;
  }
  const max = file.type.startsWith("video/")
    ? 25 * 1024 * 1024
    : 12 * 1024 * 1024;
  if (file.size > max) {
    const error = new Error(
      `File troppo grande: massimo ${Math.round(max / 1024 / 1024)} MB`,
    );
    error.status = 400;
    throw error;
  }
  const key = `${prefix}/${Date.now()}-${id()}.${ext(file.name)}`;
  await env.MEDIA.put(key, await file.arrayBuffer(), {
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
    profiles: profiles.results.map((p) =>
      session
        ? { ...p, avatar_url: mediaUrl(p.avatar_key) }
        : {
            id: p.id,
            name: p.name,
            surname: String(p.surname || "").trim().slice(0, 1),
            origin_city: p.origin_city || "",
            role: p.role,
            avatar_url: mediaUrl(p.avatar_key),
            created_at: p.created_at,
          },
    ),
    posts: posts.results.filter((p) => canViewPost(p, session, guest)).map((p) => ({
      ...p,
      author_name: publicName(p.profile_id, p.author_name),
      media_url: mediaUrl(p.media_key),
      media: [
        ...(p.media_key
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
          .map((m) => ({ ...m, media_url: mediaUrl(m.media_key) })),
      ],
      comments: comments.results
        .filter((c) => c.post_id === p.id)
        .map((c) => ({
          ...c,
          author_name: publicName(c.profile_id, c.author_name),
          media_url: mediaUrl(c.media_key),
        })),
      reactions: reactions.results.filter((r) => r.post_id === p.id),
    })),
  };
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const path = (
    Array.isArray(params.path)
      ? params.path.join("/")
      : String(params.path || "")
  ).replace(/^\/+|\/+$/g, "");
  try {
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
      const body = await request.json();
      const profile = await env.DB.prepare(
        "SELECT id,name,surname,role FROM profiles WHERE id=?",
      )
        .bind(String(body.profile_id || ""))
        .first();
      if (!profile) return json({ error: "Profilo non trovato" }, 404);
      let issued;
      try {
        issued = await claimInitialProfile(env, profile.id, deviceNameFromRequest(request));
      } catch (error) {
        if (/UNIQUE|constraint/i.test(String(error?.message || error)))
          return json(
            {
              error:
                "Profilo già collegato. Per un secondo telefono serve un invito del coordinatore.",
            },
            409,
          );
        throw error;
      }
      return json({
        ...issued,
        profile: {
          id: profile.id,
          name: profile.name,
          surname: profile.surname,
          role: profile.role,
        },
      });
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
      if (token)
        await env.DB.prepare(
          "UPDATE auth_sessions SET revoked_at=? WHERE token_hash=?",
        )
          .bind(now(), await tokenHash(token))
          .run();
      return json({ ok: true });
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
      return json({ ok: true, current_revoked: deviceId === session.device_id });
    }
    if (request.method === "POST" && path === "auth/logout-all") {
      const session = await sessionFromRequest(request, env);
      if (!session) return json({ error: "Sessione non valida" }, 401);
      await env.DB.prepare(
        "UPDATE auth_sessions SET revoked_at=? WHERE profile_id=? AND revoked_at IS NULL",
      )
        .bind(now(), session.profile_id)
        .run();
      return json({ ok: true });
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
    if (["GET", "HEAD"].includes(request.method) && path.startsWith("media/")) {
      const key = decodeURIComponent(path.slice(6));
      if (key.startsWith("private/")) {
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
      if (key.startsWith("restricted/")) {
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
      const meta = await env.MEDIA.getWithMetadata(key, { type: "arrayBuffer" });
      if (!meta.value) return new Response("Not found", { status: 404 });
      const bytes = meta.value;
      const headers = {
        ...responseSecurityHeaders,
        "content-type": meta.metadata?.contentType || "application/octet-stream",
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
        avatar_key: avatar?.key || null,
        created_at: now(),
      };
      await env.DB.prepare(
        "INSERT INTO profiles(id,name,surname,age,job,origin_city,bio,role,avatar_key,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)",
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
          "UPDATE profiles SET name=?,surname=?,age=?,job=?,origin_city=?,bio=?,role=?,avatar_key=? WHERE id=?",
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
            profileId,
          )
          .run();
      } catch (error) {
        if (avatar?.key) await env.MEDIA.delete(avatar.key);
        throw error;
      }
      if (avatar?.key && current.avatar_key)
        await env.MEDIA.delete(current.avatar_key);
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
      if (files.length > 10)
        return json(
          {
            error: `Puoi caricare massimo 10 contenuti per volta. Hai selezionato ${files.length} elementi.`,
          },
          400,
        );
      const savedMedia = [];
      const requestedVisibility = String(form.get("visibility") || "public");
      if (!["public", "family", "group", "private"].includes(requestedVisibility))
        return json({ error: "Visibilità non valida" }, 400);
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
      } catch (error) {
        await Promise.all(savedMedia.map((media) => env.MEDIA.delete(media.key)));
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
      if (p?.media_key) await env.MEDIA.delete(p.media_key);
      const mediaRows = await env.DB.prepare(
        "SELECT media_key FROM post_media WHERE post_id=?",
      )
        .bind(postId)
        .all();
      await Promise.all(mediaRows.results.map((m) => env.MEDIA.delete(m.media_key)));
      const commentMediaRows = await env.DB.prepare(
        "SELECT media_key FROM comments WHERE post_id=? AND media_key IS NOT NULL",
      )
        .bind(postId)
        .all();
      await Promise.all(
        commentMediaRows.results.map((media) => env.MEDIA.delete(media.media_key)),
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
        if (media?.key) await env.MEDIA.delete(media.key);
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
      if (existing.media_key) await env.MEDIA.delete(existing.media_key);
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
      if (
        session.role !== "coordinator" &&
        String(b.profile_id || "") !== session.profile_id
      )
        return json({ error: "Puoi aggiornare soltanto la tua posizione" }, 403);
      await env.DB.prepare(
        "INSERT INTO locations(profile_id,display_name,latitude,longitude,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(profile_id) DO UPDATE SET display_name=excluded.display_name,latitude=excluded.latitude,longitude=excluded.longitude,updated_at=excluded.updated_at",
      )
        .bind(
          b.profile_id,
          b.display_name,
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
      if (
        !session ||
        (session.role !== "coordinator" && session.profile_id !== profileId)
      )
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
      if (
        !session ||
        (session.role !== "coordinator" && session.profile_id !== profileId)
      )
        return json({ error: "Documento non autorizzato" }, 403);
      const type = String(form.get("doc_type"));
      if (!["passport", "visa", "tickets", "insurance"].includes(type))
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
        media = await saveMedia(env, form.get("file"), "private");
      } catch (error) {
        await abandonIdempotentOperation(env, operation.operationHash);
        throw error;
      }
      const previous = await env.DB.prepare(
        "SELECT file_key FROM document_status WHERE profile_id=? AND doc_type=?",
      )
        .bind(profileId, type)
        .first();
      const status = media
        ? "uploaded"
        : String(form.get("status") || "missing");
      try {
        await env.DB.prepare(
          "INSERT INTO document_status(profile_id,doc_type,file_key,file_name,status,verified_by,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(profile_id,doc_type) DO UPDATE SET file_key=COALESCE(excluded.file_key,document_status.file_key),file_name=COALESCE(excluded.file_name,document_status.file_name),status=excluded.status,verified_by=excluded.verified_by,updated_at=excluded.updated_at",
        )
          .bind(
            profileId,
            type,
            media?.key || null,
            media?.name || null,
            status,
            String(form.get("verified_by") || ""),
            now(),
          )
          .run();
      } catch (error) {
        if (media?.key) await env.MEDIA.delete(media.key);
        await abandonIdempotentOperation(env, operation.operationHash);
        throw error;
      }
      if (media?.key && previous?.file_key && previous.file_key !== media.key)
        await env.MEDIA.delete(previous.file_key);
      const payload = { ok: true, profile_id: profileId, doc_type: type };
      await completeIdempotentOperation(env, operation.operationHash, payload);
      return json(payload);
    }
    if (path.startsWith("documents/") && request.method === "DELETE") {
      const [, profileId, type] = path.split("/");
      const session = await sessionFromRequest(request, env);
      if (
        !session ||
        (session.role !== "coordinator" && session.profile_id !== profileId)
      )
        return json({ error: "Documento non autorizzato" }, 403);
      const doc = await env.DB.prepare(
        "SELECT file_key FROM document_status WHERE profile_id=? AND doc_type=?",
      )
        .bind(profileId, type)
        .first();
      if (doc?.file_key) await env.MEDIA.delete(doc.file_key);
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
