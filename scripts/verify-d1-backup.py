import argparse
import hashlib
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
        required = {"profiles", "posts", "comments", "reactions", "document_status", "locations"}
        missing = sorted(required - tables)
        if missing:
            raise SystemExit(f"Tabelle mancanti: {', '.join(missing)}")
        counts = {
            table: connection.execute(f'SELECT COUNT(*) FROM "{table}"').fetchone()[0]
            for table in sorted(required)
        }
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
