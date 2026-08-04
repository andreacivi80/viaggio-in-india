const without = (value, blocked) => Object.fromEntries(
  Object.entries(value || {}).filter(([key]) => !blocked.has(key)),
);

const profilePrivateFields = new Set([
  "age",
  "job",
  "bio",
  "avatar_key",
]);
const internalFields = new Set([
  "profile_id",
  "visitor_id",
  "media_key",
  "file_key",
]);

export const sanitizeProfilesForPublicCache = (profiles = []) =>
  profiles.map((profile) => without(profile, profilePrivateFields));

export const sanitizePostsForPublicCache = (posts = []) =>
  posts
    .filter((post) => (post.visibility || "public") === "public")
    .map((post) => ({
      ...without(post, internalFields),
      can_manage: false,
      media: (post.media || []).map((media) => without(media, internalFields)),
      comments: (post.comments || []).map((comment) => ({
        ...without(comment, internalFields),
        can_manage: false,
        media: (comment.media || []).map((media) => without(media, internalFields)),
      })),
      reactions: (post.reactions || []).map((reaction) => without(reaction, internalFields)),
    }));
