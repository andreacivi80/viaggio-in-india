import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../functions/api/[[path]].js", import.meta.url), "utf8");
const client = await readFile(new URL("../src/main.jsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const migration = await readFile(new URL("../db/migrations/0030_comment_conversations.sql", import.meta.url), "utf8");

test("risposte e reazioni ai commenti hanno schema additivo e indici dedicati", () => {
  assert.match(schema, /parent_comment_id TEXT DEFAULT ''/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS comment_reactions[\s\S]*REFERENCES comments\(id\) ON DELETE CASCADE/);
  assert.match(schema, /UNIQUE\(comment_id, actor_id\)/);
  assert.match(migration, /ALTER TABLE comments ADD COLUMN parent_comment_id TEXT DEFAULT ''/);
  assert.doesNotMatch(migration, /\b(?:DROP|UPDATE)\b|DELETE\s+FROM/i);
});

test("il server convalida la risposta nello stesso post e limita la gerarchia a un livello", () => {
  assert.match(worker, /SELECT id,parent_comment_id FROM comments WHERE id=\? AND post_id=\?/);
  assert.match(worker, /parentCommentId = parentComment\.parent_comment_id \|\| parentComment\.id/);
  assert.match(worker, /INSERT INTO comments\(id,post_id,author_name,profile_id,visitor_id,text,media_key,media_type,parent_comment_id,created_at\)/);
});

test("le reazioni ai commenti derivano identità e permessi soltanto dal server", () => {
  assert.match(worker, /path === "comment-reactions"/);
  assert.match(worker, /actorId = session[\s\S]*`profile:\$\{session\.profile_id\}`[\s\S]*`guest:\$\{guest\.visitor_id\}`/);
  assert.match(worker, /FROM comments c JOIN posts p ON p\.id=c\.post_id/);
  assert.match(worker, /if \(!canViewPost\(target, session, guest\)\)/);
  assert.match(worker, /ON CONFLICT\(comment_id,actor_id\) DO UPDATE SET/);
});

test("eliminare un commento o una pubblicazione rimuove risposte e reazioni collegate", () => {
  assert.match(worker, /DELETE FROM comment_reactions WHERE comment_id IN \(SELECT id FROM comments WHERE id=\? OR parent_comment_id=\?\)/);
  assert.match(worker, /DELETE FROM comments WHERE parent_comment_id=\?/);
  assert.match(worker, /DELETE FROM comment_reactions WHERE comment_id IN \(SELECT id FROM comments WHERE post_id=\?\)/);
});

test("l'interfaccia touch consente risposta, annullamento e tre reazioni leggibili", () => {
  assert.match(client, /setReplyingToComment\(\{ id: x\.id, authorName:/);
  assert.match(client, /f\.set\("parent_comment_id", replyingToComment\.id\)/);
  assert.match(client, /\["heart", "♥", "Cuore"\]/);
  assert.match(client, /\["clap", "👏", "Applauso"\]/);
  assert.match(client, /\["laugh", "😄", "Risata"\]/);
  assert.match(styles, /\.commentReply\s*\{/);
  assert.match(styles, /\.commentReactions button\s*\{[^}]*min-width:\s*38px;[^}]*min-height:\s*34px;/s);
});
