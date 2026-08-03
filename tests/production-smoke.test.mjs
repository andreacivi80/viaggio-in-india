import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = (process.env.TEST_BASE_URL || "https://viaggio-in-india-2026.pages.dev").replace(/\/$/, "");
const packageData = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));

async function request(path, options = {}) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await fetch(`${base}${path}`, options);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

test("dominio, revisione, mappa e Service Worker sono coerenti", async () => {
  const page = await request(`/?qa=${packageData.version}`, { cache: "no-store" });
  assert.equal(page.status, 200);
  assert.equal(page.headers.get("x-content-type-options"), "nosniff");
  assert.match(page.headers.get("content-security-policy") || "", /default-src 'self'/);
  const html = await page.text();
  const asset = html.match(/src="([^"]+\.js)"/)?.[1];
  const stylesheet = html.match(/href="([^"]+\.css)"/)?.[1];
  assert.ok(asset, "bundle JavaScript non trovato");
  assert.ok(stylesheet, "foglio di stile non trovato");
  const bundle = await (await request(asset, { cache: "no-store" })).text();
  const css = await (await request(stylesheet, { cache: "no-store" })).text();
  assert.match(bundle, new RegExp(packageData.version.replaceAll(".", "\\.")));
  assert.match(bundle, /tiles\.openfreemap\.org\/styles\/liberty/);
  assert.doesNotMatch(bundle, /192\.168\./);
  assert.doesNotMatch(bundle, /india26/i);
  assert.match(css, /\.hero:not\(\.heroFeed\)\{height:auto;min-height:330px\}/);
  assert.doesNotMatch(css, /\.hero:not\(\.heroFeed\) \.heroCopy\{top:100px/);
  const worker = await (await request("/sw.js", { cache: "no-store" })).text();
  assert.match(worker, new RegExp(packageData.version.replaceAll(".", "\\.")));
});

test("stato pubblico non espone campi privati dei profili", async () => {
  const response = await request("/api/state", { cache: "no-store" });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const state = await response.json();
  assert.ok(Array.isArray(state.profiles));
  for (const profile of state.profiles) {
    for (const privateField of ["age", "job", "bio", "avatar_key"])
      assert.equal(privateField in profile, false, `${privateField} esposto al pubblico`);
  }
});

test("documenti e posizioni private sono negate al pubblico", async () => {
  assert.equal((await request("/api/private", { cache: "no-store" })).status, 401);
  assert.equal(
    (await request("/api/locations/profilo-non-autorizzato", { method: "DELETE" })).status,
    403,
  );
});

test("il pubblico non può eliminare pubblicazioni nemmeno forzando la richiesta", async () => {
  const state = await (await request("/api/state", { cache: "no-store" })).json();
  assert.ok(state.posts.length > 0, "nessuna pubblicazione disponibile per il controllo");
  const postId = state.posts[0].id;
  const denied = await request(`/api/posts/${encodeURIComponent(postId)}`, {
    method: "DELETE",
  });
  assert.equal(denied.status, 403);
  const after = await (await request("/api/state", { cache: "no-store" })).json();
  assert.ok(after.posts.some((post) => post.id === postId), "la pubblicazione è stata eliminata dal pubblico");
});

test("commenti e reazioni richiedono un'identità server", async () => {
  const postId = "post-inesistente-collaudo-autorizzazioni";
  const comment = new FormData();
  comment.set("post_id", postId);
  comment.set("author_name", "Nome modificato dal browser");
  comment.set("visitor_id", "id-modificato");
  comment.set("text", "tentativo non autorizzato");
  assert.equal((await request("/api/comments", { method: "POST", body: comment })).status, 401);
  assert.equal(
    (await request("/api/reactions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ post_id: postId, visitor_id: "id-modificato", author_name: "Nome modificato", kind: "heart" }),
    })).status,
    401,
  );
});

test("identità ospite valida e richieste vuote sono gestite senza scritture", async () => {
  const guestResponse = await request("/api/auth/guest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ display_name: "Collaudo automatico" }),
  });
  assert.equal(guestResponse.status, 201);
  const guest = await guestResponse.json();
  assert.ok(guest.token && guest.visitor_id);
  const state = await (await request("/api/state", { cache: "no-store" })).json();
  const empty = new FormData();
  empty.set("post_id", state.posts[0].id);
  const emptyResponse = await request("/api/comments", {
    method: "POST",
    headers: { "x-guest-token": guest.token },
    body: empty,
  });
  assert.equal(emptyResponse.status, 400);
});

test("lo stesso invio non crea due commenti né inverte due volte una reazione", async () => {
  const guestResponse = await request("/api/auth/guest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ display_name: "Collaudo idempotenza" }),
  });
  assert.equal(guestResponse.status, 201);
  const guest = await guestResponse.json();
  const state = await (await request("/api/state", { cache: "no-store" })).json();
  const postId = state.posts[0]?.id;
  assert.ok(postId, "nessuna pubblicazione disponibile");
  const operationKey = crypto.randomUUID();
  const sendComment = () => {
    const form = new FormData();
    form.set("post_id", postId);
    form.set("text", "Collaudo idempotenza temporaneo");
    return request("/api/comments", {
      method: "POST",
      headers: {
        "x-guest-token": guest.token,
        "x-idempotency-key": operationKey,
        "x-qa-silent": "true",
      },
      body: form,
    });
  };
  const firstResponse = await sendComment();
  const secondResponse = await sendComment();
  assert.equal(firstResponse.status, 201);
  assert.equal(secondResponse.status, 201);
  assert.equal(secondResponse.headers.get("idempotency-replayed"), "true");
  const first = await firstResponse.json();
  const second = await secondResponse.json();
  assert.equal(first.id, second.id);
  const afterComments = await (await request("/api/state", {
    headers: { "x-guest-token": guest.token },
    cache: "no-store",
  })).json();
  const occurrences = afterComments.posts
    .flatMap((post) => post.comments || [])
    .filter((comment) => comment.id === first.id).length;
  assert.equal(occurrences, 1);

  const reactionKey = crypto.randomUUID();
  const reactionRequest = () => request("/api/reactions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-guest-token": guest.token,
      "x-idempotency-key": reactionKey,
    },
    body: JSON.stringify({ post_id: postId, kind: "clap" }),
  });
  const firstReaction = await reactionRequest();
  const secondReaction = await reactionRequest();
  assert.equal(firstReaction.status, 200);
  assert.equal(secondReaction.status, 200);
  assert.equal((await firstReaction.json()).reaction, "clap");
  assert.equal((await secondReaction.json()).reaction, "clap");
  assert.equal(secondReaction.headers.get("idempotency-replayed"), "true");

  await request(`/api/comments/${encodeURIComponent(first.id)}`, {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      "x-guest-token": guest.token,
    },
    body: "{}",
  });
  await request("/api/reactions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-guest-token": guest.token,
      "x-idempotency-key": crypto.randomUUID(),
    },
    body: JSON.stringify({ post_id: postId, kind: "clap" }),
  });
});

test("retry autenticati non duplicano pubblicazioni e documenti", {
  skip: !process.env.QA_SESSION_TOKEN || !process.env.QA_PROFILE_ID,
}, async () => {
  const authorization = `Bearer ${process.env.QA_SESSION_TOKEN}`;
  const profileId = process.env.QA_PROFILE_ID;
  const postKey = crypto.randomUUID();
  const sendPost = () => {
    const form = new FormData();
    form.set("day_index", "-1");
    form.set("visibility", "private");
    form.set("text", "Collaudo retry autenticato temporaneo");
    form.append("files", new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], {
      type: "image/jpeg",
    }), "retry-test.jpg");
    return request("/api/posts", {
      method: "POST",
      headers: {
        authorization,
        "x-idempotency-key": postKey,
        "x-qa-silent": "true",
      },
      body: form,
    });
  };
  const firstPostResponse = await sendPost();
  const secondPostResponse = await sendPost();
  assert.equal(firstPostResponse.status, 201);
  assert.equal(secondPostResponse.status, 201);
  assert.equal(secondPostResponse.headers.get("idempotency-replayed"), "true");
  const firstPost = await firstPostResponse.json();
  const secondPost = await secondPostResponse.json();
  assert.equal(firstPost.id, secondPost.id);

  const documentKey = crypto.randomUUID();
  const sendDocument = () => {
    const form = new FormData();
    form.set("profile_id", profileId);
    form.set("doc_type", "insurance");
    form.set("file", new Blob(["documento tecnico temporaneo"], {
      type: "application/pdf",
    }), "collaudo.pdf");
    return request("/api/documents", {
      method: "POST",
      headers: { authorization, "x-idempotency-key": documentKey },
      body: form,
    });
  };
  const firstDocument = await sendDocument();
  const secondDocument = await sendDocument();
  assert.equal(firstDocument.status, 200);
  assert.equal(secondDocument.status, 200);
  assert.equal(secondDocument.headers.get("idempotency-replayed"), "true");

  assert.equal((await request(`/api/posts/${firstPost.id}`, {
    method: "DELETE",
    headers: { authorization },
  })).status, 200);
  assert.equal((await request(`/api/documents/${profileId}/insurance`, {
    method: "DELETE",
    headers: { authorization },
  })).status, 200);
});

test("health API risponde e non usa il computer locale", async () => {
  const response = await request("/api/health", { cache: "no-store" });
  assert.equal(response.status, 200);
  const health = await response.json();
  assert.equal(health.ok, true);
  assert.equal(Number.isFinite(Number(health.version)), true);
});

test("tutte le fotografie delle città sono locali e disponibili", async () => {
  for (const city of ["delhi", "udaipur", "ranakpur", "jodhpur", "jaipur", "agra", "varanasi"]) {
    const response = await request(`/cities/${city}.jpg`);
    assert.equal(response.status, 200, `foto ${city} non disponibile`);
    assert.match(response.headers.get("content-type") || "", /^image\/jpeg/);
    const bytes = new Uint8Array(await response.arrayBuffer());
    assert.ok(bytes.byteLength > 10_000, `foto ${city} troppo piccola o vuota`);
    assert.deepEqual(Array.from(bytes.slice(0, 3)), [0xff, 0xd8, 0xff], `foto ${city} non è un JPEG valido`);
  }
});

test("rate limiting blocca una raffica di accessi errati", { skip: process.env.RUN_ABUSE !== "true" }, async () => {
  const statuses = [];
  for (let index = 0; index < 12; index += 1) {
    const response = await request("/api/auth/group", {
      method: "POST",
      headers: { "x-group-code": `codice-errato-${Date.now()}-${index}` },
    });
    statuses.push(response.status);
  }
  assert.ok(statuses.includes(429), `nessun 429: ${statuses.join(",")}`);
});
