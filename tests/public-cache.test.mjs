import test from "node:test";
import assert from "node:assert/strict";
import {
  sanitizePostsForPublicCache,
  sanitizeProfilesForPublicCache,
} from "../src/publicCache.js";

test("la cache offline non conserva campi personali o contenuti non pubblici", () => {
  const profiles = sanitizeProfilesForPublicCache([{
    id: "p1",
    name: "Andrea",
    origin_city: "Milano",
    age: "29",
    job: "Designer",
    bio: "Privata",
    avatar_key: "private/avatar.jpg",
    avatar_url: "/api/media/public-avatar",
  }]);
  assert.deepEqual(profiles, [{
    id: "p1",
    name: "Andrea",
    origin_city: "Milano",
    avatar_url: "/api/media/public-avatar",
  }]);

  const posts = sanitizePostsForPublicCache([
    { id: "private", visibility: "private", text: "Segreto" },
    {
      id: "public",
      visibility: "public",
      text: "Ricordo",
      profile_id: "p1",
      media_key: "private/post.jpg",
      can_manage: true,
      media: [{ url: "/api/media/public", media_key: "private/media.jpg" }],
      comments: [{
        id: "c1",
        text: "Ciao",
        profile_id: "p1",
        visitor_id: "v1",
        media_key: "private/comment.jpg",
        can_manage: true,
        media: [{ url: "/api/media/comment", file_key: "private/file.jpg" }],
      }],
      reactions: [{ kind: "heart", visitor_id: "v1", profile_id: "p1" }],
    },
  ]);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].id, "public");
  assert.equal(posts[0].can_manage, false);
  assert.equal("profile_id" in posts[0], false);
  assert.equal("media_key" in posts[0], false);
  assert.equal("media_key" in posts[0].media[0], false);
  assert.equal(posts[0].comments[0].can_manage, false);
  assert.equal("profile_id" in posts[0].comments[0], false);
  assert.equal("visitor_id" in posts[0].comments[0], false);
  assert.equal("file_key" in posts[0].comments[0].media[0], false);
  assert.equal("visitor_id" in posts[0].reactions[0], false);
});
