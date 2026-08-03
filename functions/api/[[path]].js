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
  const [profiles, posts, comments, reactions] = await Promise.all([
    env.DB.prepare("SELECT * FROM profiles ORDER BY created_at").all(),
    env.DB.prepare(
      "SELECT * FROM posts WHERE visibility='public' ORDER BY created_at DESC",
    ).all(),
    env.DB.prepare("SELECT * FROM comments ORDER BY created_at").all(),
    env.DB.prepare(
      "SELECT post_id, kind, COUNT(*) AS total FROM reactions GROUP BY post_id, kind",
    ).all(),
  ]);
  return {
    profiles: profiles.results.map((p) => ({
      ...p,
      avatar_url: mediaUrl(p.avatar_key),
    })),
    posts: posts.results.map((p) => ({
      ...p,
      media_url: mediaUrl(p.media_key),
      comments: comments.results
        .filter((c) => c.post_id === p.id)
        .map((c) => ({ ...c, media_url: mediaUrl(c.media_key) })),
      reactions: reactions.results.filter((r) => r.post_id === p.id),
    })),
  };
}

export async function onRequest({ request, env, params }) {
  const path = (
    Array.isArray(params.path)
      ? params.path.join("/")
      : String(params.path || "")
  ).replace(/^\/+|\/+$/g, "");
  try {
    if (request.method === "GET" && path === "state")
      return json(await readState(env));
    if (request.method === "GET" && path.startsWith("media/")) {
      const key = decodeURIComponent(path.slice(6));
      if (key.startsWith("private/") && !groupOk(request, env))
        return json({ error: "Accesso negato" }, 403);
      const value = await env.MEDIA.get(key, { type: "arrayBuffer" });
      if (!value) return new Response("Not found", { status: 404 });
      const meta = await env.MEDIA.getWithMetadata(key, { type: "stream" });
      return new Response(meta.value, {
        headers: {
          "content-type":
            meta.metadata?.contentType || "application/octet-stream",
          "cache-control": key.startsWith("public/")
            ? "public, max-age=31536000, immutable"
            : "private, no-store",
        },
      });
    }
    if (request.method === "POST" && path === "profiles") {
      if (!groupOk(request, env))
        return json({ error: "Codice del gruppo richiesto" }, 403);
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
        bio: String(form.get("bio") || ""),
        avatar_key: avatar?.key || null,
        created_at: now(),
      };
      await env.DB.prepare(
        "INSERT INTO profiles(id,name,surname,age,job,bio,avatar_key,created_at) VALUES(?,?,?,?,?,?,?,?)",
      )
        .bind(
          row.id,
          row.name,
          row.surname,
          row.age,
          row.job,
          row.bio,
          row.avatar_key,
          row.created_at,
        )
        .run();
      return json({ ...row, avatar_url: mediaUrl(row.avatar_key) }, 201);
    }
    if (request.method === "POST" && path === "posts") {
      if (!groupOk(request, env))
        return json({ error: "Codice del gruppo richiesto" }, 403);
      const form = await request.formData();
      const file = form.get("file");
      const media = await saveMedia(env, file, "public");
      const row = {
        id: id(),
        author_name: String(form.get("author_name") || "Viaggiatore"),
        profile_id: String(form.get("profile_id") || ""),
        day_index: Number(form.get("day_index") || 0),
        visibility: String(form.get("visibility") || "public"),
        text: String(form.get("text") || ""),
        created_at: now(),
      };
      await env.DB.prepare(
        "INSERT INTO posts(id,author_name,profile_id,day_index,visibility,text,media_key,media_type,media_name,media_size,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
      )
        .bind(
          row.id,
          row.author_name,
          row.profile_id,
          row.day_index,
          row.visibility,
          row.text,
          media?.key || null,
          media?.type || null,
          media?.name || null,
          media?.size || 0,
          row.created_at,
        )
        .run();
      return json({ ...row, media_url: mediaUrl(media?.key) }, 201);
    }
    if (request.method === "DELETE" && path.startsWith("posts/")) {
      if (!groupOk(request, env)) return json({ error: "Codice non corretto" }, 403);
      const postId = path.slice(6);
      const p = await env.DB.prepare("SELECT media_key FROM posts WHERE id=?")
        .bind(postId)
        .first();
      if (p?.media_key) await env.MEDIA.delete(p.media_key);
      await env.DB.batch([
        env.DB.prepare("DELETE FROM comments WHERE post_id=?").bind(postId),
        env.DB.prepare("DELETE FROM reactions WHERE post_id=?").bind(postId),
        env.DB.prepare("DELETE FROM posts WHERE id=?").bind(postId),
      ]);
      return json({ ok: true });
    }
    if (request.method === "POST" && path === "comments") {
      const form = await request.formData();
      const author = String(form.get("author_name") || "").trim();
      if (!author) return json({ error: "Inserisci il nome" }, 400);
      const media = await saveMedia(env, form.get("file"), "public");
      const row = {
        id: id(),
        post_id: String(form.get("post_id") || ""),
        author_name: author,
        text: String(form.get("text") || ""),
        created_at: now(),
      };
      await env.DB.prepare(
        "INSERT INTO comments(id,post_id,author_name,text,media_key,media_type,created_at) VALUES(?,?,?,?,?,?,?)",
      )
        .bind(
          row.id,
          row.post_id,
          row.author_name,
          row.text,
          media?.key || null,
          media?.type || null,
          row.created_at,
        )
        .run();
      return json({ ...row, media_url: mediaUrl(media?.key) }, 201);
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
        "INSERT INTO reactions(id,post_id,visitor_id,kind,created_at) VALUES(?,?,?,?,?)",
      )
        .bind(id(), b.post_id, b.visitor_id, kind, now())
        .run();
      return json({ ok: true, reaction: kind });
    }
    if (path === "private" && request.method === "GET") {
      if (!groupOk(request, env)) return json({ error: "Codice non corretto" }, 403);
      const [docs, locations] = await Promise.all([
        env.DB.prepare("SELECT * FROM document_status").all(),
        env.DB.prepare(
          "SELECT * FROM locations ORDER BY updated_at DESC",
        ).all(),
      ]);
      return json({ documents: docs.results, locations: locations.results });
    }
    if (path === "locations" && request.method === "POST") {
      if (!groupOk(request, env)) return json({ error: "Codice non corretto" }, 403);
      const b = await request.json();
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
    if (path === "documents" && request.method === "POST") {
      if (!groupOk(request, env)) return json({ error: "Codice non corretto" }, 403);
      const form = await request.formData();
      const media = await saveMedia(env, form.get("file"), "private");
      const profileId = String(form.get("profile_id"));
      const type = String(form.get("doc_type"));
      const status = media
        ? "uploaded"
        : String(form.get("status") || "missing");
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
      return json({ ok: true });
    }
    if (path.startsWith("documents/") && request.method === "DELETE") {
      if (!groupOk(request, env)) return json({ error: "Codice non corretto" }, 403);
      const [, profileId, type] = path.split("/");
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
