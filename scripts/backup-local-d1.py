import sqlite3
import sys
import tempfile
from pathlib import Path


if len(sys.argv) != 3:
    raise SystemExit("Uso: backup-local-d1.py <cartella-persistenza> <export.sql>")

root = Path(sys.argv[1])
output = Path(sys.argv[2])
source_path = None
for candidate in sorted(root.rglob("*"), key=lambda path: path.stat().st_mtime if path.is_file() else 0, reverse=True):
    if not candidate.is_file():
        continue
    try:
        if candidate.read_bytes()[:16] != b"SQLite format 3\x00":
            continue
        connection = sqlite3.connect(f"file:{candidate.as_posix()}?mode=ro", uri=True)
        try:
            tables = {row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        finally:
            connection.close()
        if {"profiles", "posts", "document_status"}.issubset(tables):
            source_path = candidate
            break
    except (OSError, sqlite3.DatabaseError):
        continue

if source_path is None:
    raise SystemExit("Database D1 locale non trovato")

with tempfile.TemporaryDirectory(prefix="india-online-backup-") as folder:
    snapshot_path = Path(folder) / "snapshot.sqlite"
    source = sqlite3.connect(source_path)
    snapshot = sqlite3.connect(snapshot_path)
    try:
        source.backup(snapshot, pages=64, sleep=0.01)
        if snapshot.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
            raise SystemExit("Snapshot SQLite non integro")
        dump = "\n".join(snapshot.iterdump()) + "\n"
        output.write_text(dump, encoding="utf-8")
    finally:
        snapshot.close()
        source.close()

print(f"ONLINE_BACKUP_OK source={source_path} bytes={output.stat().st_size}")
