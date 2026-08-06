import argparse
import hashlib
import json
import sqlite3
import tempfile
import time
from pathlib import Path


parser = argparse.ArgumentParser(description="Ripristina e verifica un export D1 in un database temporaneo.")
parser.add_argument("backup", type=Path)
args = parser.parse_args()

started = time.perf_counter()
payload = args.backup.read_bytes()
checksum = hashlib.sha256(payload).hexdigest().upper()

with tempfile.TemporaryDirectory(prefix="india-backup-check-") as folder:
    database = Path(folder) / "restore.sqlite"
    connection = sqlite3.connect(database)
    try:
        connection.executescript(payload.decode("utf-8"))
        integrity = connection.execute("PRAGMA integrity_check").fetchone()[0]
        if integrity != "ok":
            raise SystemExit(f"Integrità non valida: {integrity}")
        tables = {
            row[0]
            for row in connection.execute("SELECT name FROM sqlite_schema WHERE type='table'")
        }
        required = {"profiles", "posts", "comments", "reactions", "document_status", "locations", "sync_state"}
        missing = sorted(required - tables)
        if missing:
            raise SystemExit(f"Tabelle mancanti: {', '.join(missing)}")
        counts = {
            table: connection.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
            for table in sorted(required)
        }
        document_keys = [
            {"profile_id": row[0], "doc_type": row[1], "file_key": row[2], "file_name": row[3]}
            for row in connection.execute(
                "SELECT profile_id,doc_type,file_key,file_name FROM document_status WHERE file_key IS NOT NULL ORDER BY profile_id,doc_type"
            )
        ]
        restored_posts = [
            {"id": row[0], "text": row[1]}
            for row in connection.execute("SELECT id,text FROM posts ORDER BY id")
        ]
        client_versions = [
            connection.execute("SELECT version FROM sync_state WHERE id=1").fetchone()[0]
            for _ in range(2)
        ]
        orphan_comments = connection.execute(
            "SELECT COUNT(*) FROM comments c LEFT JOIN posts p ON p.id=c.post_id WHERE p.id IS NULL"
        ).fetchone()[0]
        orphan_reactions = connection.execute(
            "SELECT COUNT(*) FROM reactions r LEFT JOIN posts p ON p.id=r.post_id WHERE p.id IS NULL"
        ).fetchone()[0]
        if orphan_comments or orphan_reactions:
            raise SystemExit(
                f"Relazioni orfane: commenti={orphan_comments}, reazioni={orphan_reactions}"
            )
    finally:
        connection.close()

elapsed = time.perf_counter() - started
print(f"BACKUP_OK sha256={checksum} secondi={elapsed:.3f}")
print("RIGHE " + " ".join(f"{name}={value}" for name, value in counts.items()))
print("DOCUMENTI " + json.dumps(document_keys, ensure_ascii=False, separators=(",", ":")))
print("POSTS " + json.dumps(restored_posts, ensure_ascii=False, separators=(",", ":")))
print("CLIENT_VERSIONS " + json.dumps(client_versions, separators=(",", ":")))
