"""Encrypt small event backups; restore only into an empty, separate database.

Usage: uv run database_backup.py backup --file ../backups/demo.enc --key ../private/backup.key
       uv run database_backup.py restore --file ../backups/demo.enc --key ../private/backup.key
Set PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD and PGSSLMODE in the shell.
For local Docker PostgreSQL use PGHOST=host.docker.internal and PGSSLMODE=disable.
"""

import argparse
import base64
import os
import secrets
import subprocess
from pathlib import Path

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

MAGIC = b"HTP-BACKUP-1\n"
IMAGE = "postgres:16.13-alpine"
ENV_NAMES = ["PGHOST", "PGPORT", "PGDATABASE", "PGUSER", "PGPASSWORD", "PGSSLMODE"]


def docker(command, data=None):
    arguments = ["docker", "run", "--rm", "-i"]
    for name in ENV_NAMES:
        if name in os.environ:
            arguments += ["--env", name]
    result = subprocess.run(arguments + [IMAGE] + command, input=data, capture_output=True)
    if result.returncode:
        # No connection strings, passwords, or database contents in errors.
        raise RuntimeError(
            f"PostgreSQL operation failed with exit code {result.returncode}. Check connectivity and privileges."
        )
    return result.stdout


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("operation", choices=["backup", "restore"])
    parser.add_argument("--file", required=True, type=Path)
    parser.add_argument("--key", required=True, type=Path)
    args = parser.parse_args()
    for required in ["PGHOST", "PGDATABASE", "PGUSER", "PGPASSWORD"]:
        if not os.environ.get(required):
            parser.error(f"Set {required} in the environment.")
    if args.operation == "backup":
        if args.file.exists():
            parser.error("Refusing to overwrite an existing backup.")
        if not args.key.exists():
            args.key.parent.mkdir(parents=True, exist_ok=True)
            with args.key.open("xb") as file:
                file.write(base64.urlsafe_b64encode(secrets.token_bytes(32)))
            args.key.chmod(0o600)
        key = base64.urlsafe_b64decode(args.key.read_bytes())
        dump = docker(["pg_dump", "--format=custom", "--no-owner", "--no-acl"])
        if len(dump) > 256 * 1024 * 1024:
            raise RuntimeError("This in-memory demo backup helper supports dumps up to 256 MB.")
        nonce = secrets.token_bytes(12)
        encrypted = AESGCM(key).encrypt(nonce, dump, MAGIC)
        args.file.parent.mkdir(parents=True, exist_ok=True)
        with args.file.open("xb") as file:
            file.write(MAGIC + nonce + encrypted)
        print("Encrypted backup created. Keep its key separately.")
    else:
        key = base64.urlsafe_b64decode(args.key.read_bytes())
        encrypted = args.file.read_bytes()
        if not encrypted.startswith(MAGIC):
            parser.error("Unrecognized backup format.")
        offset = len(MAGIC)
        dump = AESGCM(key).decrypt(encrypted[offset : offset + 12], encrypted[offset + 12 :], MAGIC)
        count = docker(
            [
                "psql",
                "--no-psqlrc",
                "--tuples-only",
                "--no-align",
                "--command",
                "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'",
            ]
        ).strip()
        if count != b"0":
            parser.error("Restore target is not empty. Refusing to modify it.")
        docker(
            [
                "pg_restore",
                "--no-owner",
                "--no-acl",
                "--exit-on-error",
                "--dbname",
                os.environ["PGDATABASE"],
            ],
            dump,
        )
        print("Backup restored into the empty target database.")


if __name__ == "__main__":
    main()
