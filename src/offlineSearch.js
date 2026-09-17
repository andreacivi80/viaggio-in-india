function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("it-IT")
    .trim();
}

export function searchablePostText(post) {
  return normalizeSearchText([
    post?.text,
    post?.author_name,
    post?.place_name,
    ...(post?.media || []).flatMap((media) => [media?.media_name, media?.description]),
    ...(post?.comments || []).flatMap((comment) => [comment?.text, comment?.author_name]),
  ].filter(Boolean).join(" "));
}

export function filterPostsOffline(posts, query) {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return posts;
  return posts.filter((post) => {
    const text = searchablePostText(post);
    return terms.every((term) => text.includes(term));
  });
}
