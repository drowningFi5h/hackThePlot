# Data operations

Real flags, team credentials, database exports, and secret keys must remain outside Git. The private/ and backups/ directories are ignored.

## Encrypted backups

The Python helper uses AES-256-GCM authenticated encryption. It keeps the custom-format dump in memory (intended for demo dumps up to 256 MB), and writes only encrypted data to disk.

Install the backend development dependencies with uv sync --locked. Set PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD and PGSSLMODE in the shell. For local Docker PostgreSQL, use host.docker.internal, port 5432, database/user htp, and PGSSLMODE=disable. For Render, use its external database host and PGSSLMODE=require.

For a Render backup, temporarily allow only your current public IP in the database access list; remove it afterward. Never open unrestricted database access.

From backend/:

```sh
uv run database_backup.py backup --file ../backups/techhunt.enc --key ../private/backup.key
```

The helper creates a random key if absent and refuses to overwrite an existing backup. Store a copy of that key separately from the encrypted file. Credentials are passed into a temporary PostgreSQL client container as environment variables, not command-line values. Do not run on an untrusted shared Docker host.

For this short demo, export after meaningful content changes and before shutdown. For an event, back up daily during active use, immediately before launch, and at the end.

## Restore rehearsal

Point the PG environment variables to a separate, empty database. The helper refuses a target with existing public tables.

```sh
uv run database_backup.py restore --file ../backups/techhunt.enc --key ../private/backup.key
```

After restoring, run Django readiness, verify team/challenge/submission counts and leaderboard totals, then log in and verify certificates using the original application secrets.

The encryption authenticates the whole dump before any database write. Wrong keys, modified ciphertext, and truncated files fail before restoration.

## Export standings

```sh
docker compose exec -T backend python manage.py export_event
```

Save the JSON privately. It contains standings and certificate records, including revocation state, but no flags or password hashes.

## Troubleshooting

- Login gives CSRF/origin errors: FRONTEND_URL must exactly match the visited origin, and Django must list it in CSRF_TRUSTED_ORIGINS.
- Server waking up: wait briefly and retry. Do not repeatedly click submit; successful solves are idempotent.
- Challenges unavailable: check event start/end times. Login remains available outside the event.
- Audio captions fail: check that the SRT URL allows browser CORS and serves valid SRT.
- Missing tables after deployment: inspect migration logs and /health/ready/.
- Port 5432 already occupied locally: change the Compose host port and DATABASE_URL together.
- A rotated Django secret invalidates existing sessions and flag hashes. Re-enter challenge flags after such a rotation.
- A rotated certificate key invalidates existing certificate URLs. Restore the old key to keep them valid.
