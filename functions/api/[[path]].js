import webpush from "web-push";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
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
  const session = await env.DB.prepare(
    `SELECT s.profile_id,s.expires_at,p.name,p.surname,p.role
     FROM auth_sessions s
     JOIN profiles p ON p.id=s.profile_id
     WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>?`,
  )
    .bind(await tokenHash(token), now())
    .first();
  return session || null;
}
async function createSession(env, profileId) {
  const token = secureToken();
  const expiresAt = futureIso(24 * 90);
  await env.DB.prepare(
    "INSERT INTO auth_sessions(token_hash,profile_id,created_at,expires_at,revoked_at) VALUES(?,?,?,?,NULL)",
  )
    .bind(await tokenHash(token), profileId, now(), expiresAt)
    .run();
  return { token, expires_at: expiresAt };
}
async function notifySubscribers(env, payload) {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY)
    return { configured: false, sent: 0, failed: 0, errors: ["Chiavi push mancanti"] };
  webpush.setVapidDetails(
    "https://viaggio-in-india-2026.pages.dev/",
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
  const subscriptions = await env.DB.prepare(
    "SELECT id,endpoint,p256dh,auth FROM push_subscriptions",
  ).all();
  const deliveries = await Promise.all(
    subscriptions.results.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: { p256dh: subscription.p256dh, auth: subscription.auth },
          },
          JSON.stringify(payload),
          { TTL: 3600, urgency: "normal" },
        );
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
  const max = file.type.startsWith("video/")
    ? 25 * 1024 * 1024
    : 12 * 1024 * 1024;
  if (file.size > max)
    throw new Error(
      `File troppo grande: massimo ${Math.round(max / 1024 / 1024)} MB`,
    );
  const key = `${prefix}/${Date.now()}-${id()}.${ext(file.name)}`;
  await env.MEDIA.put(key, await file.arrayBuffer(), {
    metadata: {
      contentType: file.type || "application/octet-stream",
      name: file.name || "file",
    },
  });
  return {
    key,
    type: file.type || "application/octet-stream",
    name: file.name || "file",
    size: file.size,
  };
}

async function readState(env) {
  const [profiles, posts, comments, reactions, postMedia, syncState] = await Promise.all([
    env.DB.prepare("SELECT * FROM profiles ORDER BY created_at").all(),
    env.DB.prepare(
      "SELECT * FROM posts WHERE visibility='public' ORDER BY created_at DESC",
    ).all(),
    env.DB.prepare("SELECT * FROM comments ORDER BY created_at").all(),
    env.DB.prepare(
      "SELECT post_id, kind, author_name, COUNT(*) AS total FROM reactions GROUP BY post_id, kind, author_name",
    ).all(),
    env.DB.prepare("SELECT * FROM post_media ORDER BY position").all(),
    env.DB.prepare("SELECT version,updated_at FROM sync_state WHERE id=1").first(),
  ]);
  return {
    sync_version: Number(syncState?.version || 0),
    sync_updated_at: syncState?.updated_at || null,
    profiles: profiles.results.map((p) => ({
      ...p,
      avatar_url: mediaUrl(p.avatar_key),
    })),
    posts: posts.results.map((p) => ({
      ...p,
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
        .map((c) => ({ ...c, media_url: mediaUrl(c.media_key) })),
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
    if (request.method === "POST" && path === "auth/claim") {
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
        issued = await createSession(env, invite.profile_id);
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
    if (request.method === "GET" && path === "state")
      return json(await readState(env));
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
      const body = await request.json();
      const subscription = body.subscription || {};
      const endpoint = String(subscription.endpoint || "");
      const p256dh = String(subscription.keys?.p256dh || "");
      const auth = String(subscription.keys?.auth || "");
      if (!endpoint.startsWith("https://") || !p256dh || !auth)
        return json({ error: "Iscrizione notifiche non valida" }, 400);
      const subscriptionId = await tokenHash(endpoint);
      await env.DB.prepare(
        `INSERT INTO push_subscriptions(id,endpoint,p256dh,auth,profile_id,visitor_name,created_at,updated_at)
         VALUES(?,?,?,?,?,?,?,?)
         ON CONFLICT(endpoint) DO UPDATE SET p256dh=excluded.p256dh,auth=excluded.auth,profile_id=excluded.profile_id,visitor_name=excluded.visitor_name,updated_at=excluded.updated_at`,
      )
        .bind(
          subscriptionId,
          endpoint,
          p256dh,
          auth,
          session?.profile_id || "",
          session
            ? `${session.name} ${session.surname || ""}`.trim()
            : String(body.visitor_name || "Familiare").trim(),
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
      const meta = await env.MEDIA.getWithMetadata(key, { type: "arrayBuffer" });
      if (!meta.value) return new Response("Not found", { status: 404 });
      const bytes = meta.value;
      const headers = {
        "content-type": meta.metadata?.contentType || "application/octet-stream",
        "cache-control": key.startsWith("public/")
          ? "public, max-age=31536000, immutable"
          : "private, no-store",
        "accept-ranges": "bytes",
      };
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
      const row = {
        id: id(),
        author_name: `${session.name} ${session.surname || ""}`.trim(),
        profile_id: session.profile_id,
        day_index: Number(form.get("day_index") || 0),
        visibility: String(form.get("visibility") || "public"),
        text: String(form.get("text") || ""),
        place_name: String(form.get("place_name") || "").trim(),
        latitude: form.get("latitude") ? Number(form.get("latitude")) : null,
        longitude: form.get("longitude") ? Number(form.get("longitude")) : null,
        created_at: now(),
      };
      try {
        for (const file of files)
          savedMedia.push(await saveMedia(env, file, "public"));
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
        throw error;
      }
      context.waitUntil?.(
        notifySubscribers(env, {
          title: row.author_name,
          body: row.text || "Ha pubblicato un nuovo ricordo del viaggio.",
          url: "/",
          tag: `post-${row.id}`,
        }),
      );
      return json(
        {
          ...row,
          media: savedMedia.map((media, position) => ({
            ...media,
            position,
            media_url: mediaUrl(media.key),
          })),
        },
        201,
      );
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
      const form = await request.formData();
      const author = session
        ? `${session.name} ${session.surname || ""}`.trim()
        : String(form.get("author_name") || "").trim();
      if (!author) return json({ error: "Inserisci il nome" }, 400);
      const media = await saveMedia(env, form.get("file"), "public");
      const row = {
        id: id(),
        post_id: String(form.get("post_id") || ""),
        author_name: author,
        profile_id: session?.profile_id || "",
        text: String(form.get("text") || ""),
        created_at: now(),
      };
      await env.DB.prepare(
        "INSERT INTO comments(id,post_id,author_name,profile_id,visitor_id,text,media_key,media_type,created_at) VALUES(?,?,?,?,?,?,?,?,?)",
      )
        .bind(
          row.id,
          row.post_id,
          row.author_name,
          row.profile_id,
          String(form.get("visitor_id") || ""),
          row.text,
          media?.key || null,
          media?.type || null,
          row.created_at,
        )
        .run();
      context.waitUntil?.(
        notifySubscribers(env, {
          title: row.author_name,
          body: row.text || "Ha aggiunto un commento.",
          url: "/",
          tag: `comment-${row.id}`,
        }),
      );
      return json({ ...row, media_url: mediaUrl(media?.key) }, 201);
    }
    if (request.method === "PUT" && path.startsWith("comments/")) {
      const commentId = path.slice(9);
      const body = await request.json();
      const session = await sessionFromRequest(request, env);
      const existing = await env.DB.prepare(
        "SELECT visitor_id,profile_id FROM comments WHERE id=?",
      )
        .bind(commentId)
        .first();
      if (!existing) return json({ error: "Commento non trovato" }, 404);
      const ownsComment = session
        ? session.role === "coordinator" || existing.profile_id === session.profile_id
        : existing.visitor_id &&
          existing.visitor_id === String(body.visitor_id || "");
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
      const existing = await env.DB.prepare(
        "SELECT visitor_id,profile_id,media_key FROM comments WHERE id=?",
      )
        .bind(commentId)
        .first();
      if (!existing) return json({ error: "Commento non trovato" }, 404);
      const ownsComment = session
        ? session.role === "coordinator" || existing.profile_id === session.profile_id
        : existing.visitor_id &&
          existing.visitor_id === String(body.visitor_id || "");
      if (!ownsComment)
        return json({ error: "Non puoi eliminare questo commento" }, 403);
      await env.DB.prepare("DELETE FROM comments WHERE id=?").bind(commentId).run();
      if (existing.media_key) await env.MEDIA.delete(existing.media_key);
      return json({ ok: true });
    }
    if (request.method === "POST" && path === "reactions") {
      const b = await request.json();
      const kind = ["like", "heart", "laugh", "wow", "clap", "fire"].includes(
        b.kind,
      )
        ? b.kind
        : "heart";
      const existing = await env.DB.prepare(
        "SELECT kind FROM reactions WHERE post_id=? AND visitor_id=? LIMIT 1",
      )
        .bind(b.post_id, b.visitor_id)
        .first();
      await env.DB.prepare(
        "DELETE FROM reactions WHERE post_id=? AND visitor_id=?",
      )
        .bind(b.post_id, b.visitor_id)
        .run();
      if (existing?.kind === kind) return json({ ok: true, reaction: null });
      await env.DB.prepare(
        "INSERT INTO reactions(id,post_id,visitor_id,author_name,kind,created_at) VALUES(?,?,?,?,?,?)",
      )
        .bind(
          id(),
          b.post_id,
          b.visitor_id,
          String(b.author_name || "Ospite").trim() || "Ospite",
          kind,
          now(),
        )
        .run();
      return json({ ok: true, reaction: kind });
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
          Number(b.latitude),
          Number(b.longitude),
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
      const media = await saveMedia(env, form.get("file"), "private");
      const type = String(form.get("doc_type"));
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
        throw error;
      }
      if (media?.key && previous?.file_key && previous.file_key !== media.key)
        await env.MEDIA.delete(previous.file_key);
      return json({ ok: true });
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
    return json({ error: error.message || "Errore server" }, 500);
  }
}
