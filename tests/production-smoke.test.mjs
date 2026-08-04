import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = (process.env.TEST_BASE_URL || "https://viaggio-in-india-2026.pages.dev").replace(/\/$/, "");
const packageData = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));
const expectedVersion = process.env.TEST_EXPECTED_VERSION || "";
const qaRunId = process.env.QA_RUN_ID || "locale";

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
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>/i);
  assert.match(html, /sw-register\.js/);
  const asset = html.match(/src="([^"]+\.js)"/)?.[1];
  const stylesheet = html.match(/href="([^"]+\.css)"/)?.[1];
  assert.ok(asset, "bundle JavaScript non trovato");
  assert.ok(stylesheet, "foglio di stile non trovato");
  const bundle = await (await request(asset, { cache: "no-store" })).text();
  const css = await (await request(stylesheet, { cache: "no-store" })).text();
  if (expectedVersion)
    assert.match(bundle, new RegExp(expectedVersion.replaceAll(".", "\\.")));
  assert.match(bundle, /tiles\.openfreemap\.org\/styles\/liberty/);
  assert.doesNotMatch(bundle, /192\.168\./);
  assert.doesNotMatch(bundle, /india26/i);
  assert.match(css, /\.hero:not\(\.heroFeed\)\{height:auto;min-height:330px\}/);
  assert.doesNotMatch(css, /\.hero:not\(\.heroFeed\) \.heroCopy\{top:100px/);
  const worker = await (await request("/sw.js", { cache: "no-store" })).text();
  const registration = await (await request("/sw-register.js", { cache: "no-store" })).text();
  if (expectedVersion) {
    assert.match(worker, new RegExp(expectedVersion.replaceAll(".", "\\.")));
    assert.match(registration, /serviceWorker\.register/);
    assert.doesNotMatch(
      registration,
      /location\.reload/,
      "un aggiornamento non deve ricaricare la pagina mentre una persona sta lavorando",
    );
  }
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
  for (const post of state.posts) {
    for (const privateField of ["profile_id", "media_key"])
      assert.equal(privateField in post, false, `${privateField} del post esposto al pubblico`);
    assert.equal(post.can_manage, false, "un post pubblico risulta gestibile senza sessione");
    for (const media of post.media || [])
      assert.equal("media_key" in media, false, "chiave interna del file esposta al pubblico");
    for (const comment of post.comments || []) {
      for (const privateField of ["profile_id", "visitor_id", "media_key"])
        assert.equal(privateField in comment, false, `${privateField} del commento esposto al pubblico`);
      assert.equal(comment.can_manage, false, "un commento pubblico risulta gestibile senza identità");
    }
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
    body: JSON.stringify({ display_name: `Collaudo automatico ${qaRunId}` }),
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
    body: JSON.stringify({ display_name: `Collaudo idempotenza ${qaRunId}` }),
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
    form.set("file", new Blob(["%PDF-1.4\ndocumento tecnico temporaneo"], {
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

test("il proprietario vede e revoca un dispositivo secondario", {
  skip: !process.env.QA_SESSION_TOKEN || !process.env.QA_SECOND_DEVICE_ID,
}, async () => {
  const authorization = `Bearer ${process.env.QA_SESSION_TOKEN}`;
  const listResponse = await request("/api/auth/devices", {
    headers: { authorization },
    cache: "no-store",
  });
  assert.equal(listResponse.status, 200);
  const devices = (await listResponse.json()).devices;
  assert.ok(devices.some((device) => device.current));
  assert.ok(devices.some((device) => device.device_id === process.env.QA_SECOND_DEVICE_ID));
  const revoke = await request(
    `/api/auth/devices/${encodeURIComponent(process.env.QA_SECOND_DEVICE_ID)}`,
    { method: "DELETE", headers: { authorization } },
  );
  assert.equal(revoke.status, 200);
  const after = await (await request("/api/auth/devices", {
    headers: { authorization },
    cache: "no-store",
  })).json();
  assert.ok(!after.devices.some((device) => device.device_id === process.env.QA_SECOND_DEVICE_ID));
  assert.equal((await request("/api/auth/session", { headers: { authorization } })).status, 200);
});

async function multipartUpload({ authorization, scope, visibility = "private", name, type, bytes }) {
  const init = await request("/api/uploads/init", {
    method: "POST",
    headers: { authorization, "content-type": "application/json" },
    body: JSON.stringify({ scope, visibility, file_name: name, file_size: bytes.byteLength, content_type: type }),
  });
  assert.equal(init.status, 201);
  const upload = await init.json();
  let partNumber = 1;
  for (let offset = 0; offset < bytes.byteLength; offset += upload.part_size) {
    const part = await request(`/api/uploads/${upload.upload_id}/parts/${partNumber}`, {
      method: "PUT",
      headers: { authorization, "content-type": "application/octet-stream" },
      body: bytes.slice(offset, Math.min(bytes.byteLength, offset + upload.part_size)),
    });
    assert.equal(part.status, 200);
    partNumber += 1;
  }
  const complete = await request(`/api/uploads/${upload.upload_id}/complete`, {
    method: "POST",
    headers: { authorization },
  });
  assert.equal(complete.status, 200);
  return complete.json();
}

test("caricamenti grandi completi per post e documenti, streaming e pulizia", {
  skip: !process.env.QA_SESSION_TOKEN || !process.env.QA_PROFILE_ID,
}, async () => {
  const authorization = `Bearer ${process.env.QA_SESSION_TOKEN}`;
  const bytes = new Uint8Array(9 * 1024 * 1024);
  for (let index = 0; index < bytes.length; index += 4096) bytes[index] = index % 251;
  bytes.set([0x66, 0x74, 0x79, 0x70], 4);
  const uploadedPost = await multipartUpload({
    authorization,
    scope: "post",
    visibility: "private",
    name: "qa-grande.mp4",
    type: "video/mp4",
    bytes,
  });
  const postForm = new FormData();
  postForm.set("day_index", "-1");
  postForm.set("visibility", "private");
  postForm.set("text", "Collaudo upload grande temporaneo");
  postForm.set("upload_ids", JSON.stringify([uploadedPost.upload_id]));
  const postResponse = await request("/api/posts", {
    method: "POST",
    headers: { authorization, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: postForm,
  });
  assert.equal(postResponse.status, 201);
  const post = await postResponse.json();
  assert.equal(post.media[0].size, bytes.byteLength);
  const ranged = await request(post.media[0].media_url, {
    headers: { authorization, range: "bytes=4194000-4195000" },
  });
  assert.equal(ranged.status, 206);
  assert.equal((await ranged.arrayBuffer()).byteLength, 1001);
  assert.equal((await request(`/api/posts/${post.id}`, { method: "DELETE", headers: { authorization } })).status, 200);

  const pdfBytes = bytes.slice();
  pdfBytes.set([0x25, 0x50, 0x44, 0x46, 0x2d], 0);
  const uploadedDocument = await multipartUpload({
    authorization,
    scope: "document",
    name: "qa-documento-grande.pdf",
    type: "application/pdf",
    bytes: pdfBytes,
  });
  const documentForm = new FormData();
  documentForm.set("profile_id", process.env.QA_PROFILE_ID);
  documentForm.set("doc_type", "insurance");
  documentForm.set("upload_id", uploadedDocument.upload_id);
  const documentResponse = await request("/api/documents", {
    method: "POST",
    headers: { authorization, "x-idempotency-key": crypto.randomUUID() },
    body: documentForm,
  });
  assert.equal(documentResponse.status, 200);
  const privateState = await (await request("/api/private", { headers: { authorization } })).json();
  const document = privateState.documents.find((item) => item.profile_id === process.env.QA_PROFILE_ID && item.doc_type === "insurance");
  assert.ok(document?.file_key?.startsWith("chunked/private/"));
  assert.equal((await request(`/api/media/${document.file_key}`, { method: "HEAD", headers: { authorization } })).status, 200);
  assert.equal((await request(`/api/documents/${process.env.QA_PROFILE_ID}/insurance`, { method: "DELETE", headers: { authorization } })).status, 200);

  const interrupted = await request("/api/uploads/init", {
    method: "POST",
    headers: { authorization, "content-type": "application/json" },
    body: JSON.stringify({ scope: "post", visibility: "private", file_name: "interrotto.mp4", file_size: bytes.byteLength, content_type: "video/mp4" }),
  });
  assert.equal(interrupted.status, 201);
  const interruptedUpload = await interrupted.json();
  assert.equal((await request(`/api/uploads/${interruptedUpload.upload_id}/parts/1`, {
    method: "PUT",
    headers: { authorization, "content-type": "application/octet-stream" },
    body: bytes.slice(0, interruptedUpload.part_size),
  })).status, 200);
  assert.equal((await request(`/api/uploads/${interruptedUpload.upload_id}`, {
    method: "DELETE",
    headers: { authorization },
  })).status, 200);
  assert.equal((await request(`/api/uploads/${interruptedUpload.upload_id}`, {
    headers: { authorization },
  })).status, 404);
});

test("visibilità, identità e proprietà resistono alle richieste falsificate", {
  skip: !process.env.QA_SESSION_TOKEN || !process.env.QA_PROFILE_ID || !process.env.QA_SECOND_SESSION_TOKEN || !process.env.QA_SECOND_PROFILE_ID,
}, async () => {
  const ownerAuthorization = `Bearer ${process.env.QA_SESSION_TOKEN}`;
  const otherAuthorization = `Bearer ${process.env.QA_SECOND_SESSION_TOKEN}`;
  const createPost = async (visibility) => {
    const form = new FormData();
    form.set("visibility", visibility);
    form.set("day_index", "-1");
    form.set("text", `Collaudo ${visibility} ${crypto.randomUUID()}`);
    form.set("author_name", "Nome falsificato");
    const result = await request("/api/posts", {
      method: "POST",
      headers: { authorization: ownerAuthorization, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
      body: form,
    });
    assert.equal(result.status, 201);
    return result.json();
  };
  const posts = {};
  for (const visibility of ["public", "family", "group", "private"])
    posts[visibility] = await createPost(visibility);
  assert.notEqual(posts.public.author_name, "Nome falsificato");

  const publicState = await (await request("/api/state", { cache: "no-store" })).json();
  assert.ok(publicState.posts.some((post) => post.id === posts.public.id));
  for (const visibility of ["family", "group", "private"])
    assert.ok(!publicState.posts.some((post) => post.id === posts[visibility].id));

  const guestResponse = await request("/api/auth/guest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ display_name: `Ospite sicurezza ${qaRunId}` }),
  });
  assert.equal(guestResponse.status, 201);
  const guest = await guestResponse.json();
  const guestState = await (await request("/api/state", { headers: { "x-guest-token": guest.token }, cache: "no-store" })).json();
  assert.ok(guestState.posts.some((post) => post.id === posts.public.id));
  assert.ok(guestState.posts.some((post) => post.id === posts.family.id));
  assert.ok(!guestState.posts.some((post) => post.id === posts.group.id));
  assert.ok(!guestState.posts.some((post) => post.id === posts.private.id));

  const otherState = await (await request("/api/state", { headers: { authorization: otherAuthorization }, cache: "no-store" })).json();
  for (const visibility of ["public", "family", "group"])
    assert.ok(otherState.posts.some((post) => post.id === posts[visibility].id));
  assert.ok(!otherState.posts.some((post) => post.id === posts.private.id));
  assert.equal((await request(`/api/posts/${posts.private.id}`, { method: "DELETE", headers: { authorization: otherAuthorization } })).status, 403);

  const forbiddenComment = new FormData();
  forbiddenComment.set("post_id", posts.private.id);
  forbiddenComment.set("text", "Non devo entrare");
  forbiddenComment.set("visitor_id", "identita-falsificata");
  assert.equal((await request("/api/comments", { method: "POST", headers: { "x-guest-token": guest.token }, body: forbiddenComment })).status, 403);
  assert.equal((await request("/api/reactions", {
    method: "POST",
    headers: { "content-type": "application/json", "x-guest-token": guest.token },
    body: JSON.stringify({ post_id: posts.private.id, kind: "heart", visitor_id: "identita-falsificata" }),
  })).status, 403);

  const ownCommentForm = new FormData();
  ownCommentForm.set("post_id", posts.public.id);
  ownCommentForm.set("text", "Commento del proprietario");
  ownCommentForm.set("author_name", "Altro nome falsificato");
  const ownCommentResponse = await request("/api/comments", {
    method: "POST",
    headers: { authorization: ownerAuthorization, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: ownCommentForm,
  });
  assert.equal(ownCommentResponse.status, 201);
  const ownComment = await ownCommentResponse.json();
  assert.notEqual(ownComment.author_name, "Altro nome falsificato");
  assert.equal((await request(`/api/comments/${ownComment.id}`, {
    method: "PUT",
    headers: { authorization: otherAuthorization, "content-type": "application/json" },
    body: JSON.stringify({ text: "Tentativo modifica altrui" }),
  })).status, 403);
  assert.equal((await request(`/api/comments/${ownComment.id}`, {
    method: "DELETE",
    headers: { authorization: otherAuthorization, "content-type": "application/json" },
    body: "{}",
  })).status, 403);
  assert.equal((await request(`/api/comments/${ownComment.id}`, {
    method: "PUT",
    headers: { authorization: ownerAuthorization, "content-type": "application/json" },
    body: JSON.stringify({ text: "Commento aggiornato dal proprietario" }),
  })).status, 200);
  assert.equal((await request(`/api/comments/${ownComment.id}`, {
    method: "DELETE",
    headers: { authorization: ownerAuthorization, "content-type": "application/json" },
    body: "{}",
  })).status, 200);
  for (const post of Object.values(posts))
    assert.equal((await request(`/api/posts/${post.id}`, { method: "DELETE", headers: { authorization: ownerAuthorization } })).status, 200);
});

test("invito personale monouso collega un dispositivo e il logout revoca la sessione", {
  skip: !process.env.QA_SESSION_TOKEN || !process.env.QA_COORDINATOR_TOKEN || !process.env.QA_UNCLAIMED_PROFILE_ID,
}, async () => {
  const travelerAuthorization = `Bearer ${process.env.QA_SESSION_TOKEN}`;
  const coordinatorAuthorization = `Bearer ${process.env.QA_COORDINATOR_TOKEN}`;
  const invitationBody = JSON.stringify({ profile_id: process.env.QA_UNCLAIMED_PROFILE_ID });
  assert.equal((await request("/api/auth/invites", {
    method: "POST",
    headers: { authorization: travelerAuthorization, "content-type": "application/json" },
    body: invitationBody,
  })).status, 403);
  const invitationResponse = await request("/api/auth/invites", {
    method: "POST",
    headers: { authorization: coordinatorAuthorization, "content-type": "application/json" },
    body: invitationBody,
  });
  assert.equal(invitationResponse.status, 201);
  const invitation = await invitationResponse.json();
  const claim = await request("/api/auth/claim", {
    method: "POST",
    headers: { "content-type": "application/json", "x-device-name": "Telefono QA invitato" },
    body: JSON.stringify({ invite_token: invitation.invite_token }),
  });
  assert.equal(claim.status, 200);
  const claimed = await claim.json();
  assert.equal(claimed.profile.id, process.env.QA_UNCLAIMED_PROFILE_ID);
  assert.ok(claimed.token);
  assert.equal((await request("/api/auth/claim", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ invite_token: invitation.invite_token }),
  })).status, 403);
  const claimedAuthorization = `Bearer ${claimed.token}`;
  assert.equal((await request("/api/auth/session", { headers: { authorization: claimedAuthorization } })).status, 200);
  assert.equal((await request("/api/auth/logout", { method: "POST", headers: { authorization: claimedAuthorization } })).status, 200);
  assert.equal((await request("/api/auth/session", { headers: { authorization: claimedAuthorization } })).status, 401);
});

test("sessioni scadute o inattive non aprono dati privati", {
  skip: !process.env.QA_EXPIRED_SESSION_TOKEN,
}, async () => {
  const authorization = `Bearer ${process.env.QA_EXPIRED_SESSION_TOKEN}`;
  assert.equal((await request("/api/auth/session", { headers: { authorization } })).status, 401);
  assert.equal((await request("/api/private", { headers: { authorization } })).status, 401);
});

test("limiti antispam bloccano raffiche di commenti e reazioni", {
  skip: process.env.RUN_ABUSE !== "true" || !process.env.QA_SESSION_TOKEN,
}, async () => {
  const authorization = `Bearer ${process.env.QA_SESSION_TOKEN}`;
  const postForm = new FormData();
  postForm.set("visibility", "public");
  postForm.set("day_index", "-1");
  postForm.set("text", "Post temporaneo collaudo antispam");
  const postResponse = await request("/api/posts", {
    method: "POST",
    headers: { authorization, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: postForm,
  });
  assert.equal(postResponse.status, 201);
  const post = await postResponse.json();
  const guestResponse = await request("/api/auth/guest", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ display_name: `Antispam ${qaRunId}` }),
  });
  assert.equal(guestResponse.status, 201);
  const guest = await guestResponse.json();
  const commentStatuses = [];
  for (let index = 0; index < 11; index += 1) {
    const form = new FormData();
    form.set("post_id", post.id);
    form.set("text", `Commento raffica ${index}`);
    const result = await request("/api/comments", {
      method: "POST",
      headers: { "x-guest-token": guest.token, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
      body: form,
    });
    commentStatuses.push(result.status);
  }
  assert.equal(commentStatuses.filter((status) => status === 201).length, 10);
  assert.equal(commentStatuses.at(-1), 429);
  const reactionStatuses = [];
  for (let index = 0; index < 31; index += 1) {
    const result = await request("/api/reactions", {
      method: "POST",
      headers: { "content-type": "application/json", "x-guest-token": guest.token, "x-idempotency-key": crypto.randomUUID() },
      body: JSON.stringify({ post_id: post.id, kind: index % 2 ? "heart" : "clap" }),
    });
    reactionStatuses.push(result.status);
  }
  assert.equal(reactionStatuses.slice(0, 30).every((status) => status === 200), true);
  assert.equal(reactionStatuses.at(-1), 429);
  assert.equal((await request(`/api/posts/${post.id}`, { method: "DELETE", headers: { authorization } })).status, 200);
});

test("due dispositivi vedono subito post, commento, reazione ed eliminazione", {
  skip: !process.env.QA_SESSION_TOKEN || !process.env.QA_SECOND_SESSION_TOKEN,
}, async () => {
  const ownerAuthorization = `Bearer ${process.env.QA_SESSION_TOKEN}`;
  const otherAuthorization = `Bearer ${process.env.QA_SECOND_SESSION_TOKEN}`;
  const beforeVersion = await (await request("/api/sync/version", { cache: "no-store" })).json();
  const form = new FormData();
  form.set("visibility", "group");
  form.set("day_index", "-1");
  form.set("text", `Sincronizzazione multidispositivo ${crypto.randomUUID()}`);
  const postResponse = await request("/api/posts", {
    method: "POST",
    headers: { authorization: ownerAuthorization, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: form,
  });
  assert.equal(postResponse.status, 201);
  const post = await postResponse.json();
  const stateOnOther = await (await request("/api/state", { headers: { authorization: otherAuthorization }, cache: "no-store" })).json();
  assert.ok(stateOnOther.posts.some((item) => item.id === post.id));

  const commentForm = new FormData();
  commentForm.set("post_id", post.id);
  commentForm.set("text", "Commento dal secondo dispositivo");
  const commentResponse = await request("/api/comments", {
    method: "POST",
    headers: { authorization: otherAuthorization, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: commentForm,
  });
  assert.equal(commentResponse.status, 201);
  const comment = await commentResponse.json();
  const reactionResponse = await request("/api/reactions", {
    method: "POST",
    headers: { authorization: otherAuthorization, "content-type": "application/json", "x-idempotency-key": crypto.randomUUID() },
    body: JSON.stringify({ post_id: post.id, kind: "heart" }),
  });
  assert.equal(reactionResponse.status, 200);
  const stateOnOwner = await (await request("/api/state", { headers: { authorization: ownerAuthorization }, cache: "no-store" })).json();
  const synchronizedPost = stateOnOwner.posts.find((item) => item.id === post.id);
  assert.ok(synchronizedPost?.comments.some((item) => item.id === comment.id));
  assert.ok(synchronizedPost?.reactions.some((item) => item.kind === "heart"));
  const afterVersion = await (await request("/api/sync/version", { cache: "no-store" })).json();
  assert.ok(Number(afterVersion.version) > Number(beforeVersion.version));
  assert.equal((await request(`/api/posts/${post.id}`, { method: "DELETE", headers: { authorization: ownerAuthorization } })).status, 200);
  const afterDelete = await (await request("/api/state", { headers: { authorization: otherAuthorization }, cache: "no-store" })).json();
  assert.ok(!afterDelete.posts.some((item) => item.id === post.id));
});

test("dieci pubblicazioni concorrenti restano uniche e complete", {
  skip: process.env.RUN_LOAD !== "true" || !process.env.QA_SESSION_TOKEN,
}, async () => {
  const authorization = `Bearer ${process.env.QA_SESSION_TOKEN}`;
  const operations = Array.from({ length: 10 }, () => crypto.randomUUID());
  const responses = await Promise.all(operations.map((operation, index) => {
    const form = new FormData();
    form.set("visibility", "private");
    form.set("day_index", "-1");
    form.set("text", `Concorrenza ${index} ${operation}`);
    return request("/api/posts", {
      method: "POST",
      headers: { authorization, "x-idempotency-key": operation, "x-qa-silent": "true" },
      body: form,
    });
  }));
  assert.equal(responses.every((response) => response.status === 201), true);
  const posts = await Promise.all(responses.map((response) => response.json()));
  assert.equal(new Set(posts.map((post) => post.id)).size, 10);
  const state = await (await request("/api/state", { headers: { authorization }, cache: "no-store" })).json();
  assert.equal(posts.every((post) => state.posts.some((item) => item.id === post.id)), true);
  const deletions = await Promise.all(posts.map((post) => request(`/api/posts/${post.id}`, { method: "DELETE", headers: { authorization } })));
  assert.equal(deletions.every((response) => response.status === 200), true);
});

test("file camuffati e firme non coerenti vengono respinti dal server", {
  skip: !process.env.QA_SESSION_TOKEN || !process.env.QA_PROFILE_ID,
}, async () => {
  const authorization = `Bearer ${process.env.QA_SESSION_TOKEN}`;
  const maliciousPost = new FormData();
  maliciousPost.set("visibility", "private");
  maliciousPost.set("text", "Tentativo file camuffato");
  maliciousPost.set("files", new Blob(["<svg onload=alert(1)></svg>"], { type: "image/png" }), "vacanza.png");
  assert.equal((await request("/api/posts", {
    method: "POST",
    headers: { authorization, "x-idempotency-key": crypto.randomUUID(), "x-qa-silent": "true" },
    body: maliciousPost,
  })).status, 400);

  const maliciousDocument = new FormData();
  maliciousDocument.set("profile_id", process.env.QA_PROFILE_ID);
  maliciousDocument.set("doc_type", "insurance");
  maliciousDocument.set("file", new Blob(["<!doctype html><script>alert(1)</script>"], { type: "application/pdf" }), "documento.pdf");
  assert.equal((await request("/api/documents", {
    method: "POST",
    headers: { authorization, "x-idempotency-key": crypto.randomUUID() },
    body: maliciousDocument,
  })).status, 400);

  const init = await request("/api/uploads/init", {
    method: "POST",
    headers: { authorization, "content-type": "application/json" },
    body: JSON.stringify({ scope: "post", visibility: "private", file_name: "video.mp4", file_size: 9 * 1024 * 1024, content_type: "video/mp4" }),
  });
  assert.equal(init.status, 201);
  const upload = await init.json();
  const fakePart = new Uint8Array(upload.part_size);
  fakePart.set(new TextEncoder().encode("<html>video falso</html>"));
  assert.equal((await request(`/api/uploads/${upload.upload_id}/parts/1`, {
    method: "PUT",
    headers: { authorization, "content-type": "application/octet-stream" },
    body: fakePart,
  })).status, 400);
  assert.equal((await request(`/api/uploads/${upload.upload_id}`, { method: "DELETE", headers: { authorization } })).status, 200);
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
