-- Una persona può esprimere una sola reazione per post, indipendentemente
-- dall'emoji scelta. La migrazione è additiva: conserva la reazione più
-- recente e rimuove soltanto le righe duplicate della stessa persona/post.
DELETE FROM reactions
WHERE EXISTS (
  SELECT 1
  FROM reactions AS newer
  WHERE newer.post_id = reactions.post_id
    AND newer.visitor_id = reactions.visitor_id
    AND (
      newer.created_at > reactions.created_at
      OR (newer.created_at = reactions.created_at AND newer.id > reactions.id)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS reactions_person_post_unique
ON reactions(post_id, visitor_id);
