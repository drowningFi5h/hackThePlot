# Verification record

Checks run on the local Windows development machine with Docker PostgreSQL 16.13 and Python 3.12.

## Completed

- 17 PostgreSQL-backed tests passed, covering sessions, CSRF, rate limits, team imports, event boundaries, scoring, certificate revocation, guest isolation, and true concurrent transactions.
- Initial migration applied successfully to fresh databases; no pending model changes.
- OpenAPI generated and validated without warnings.
- 100-team rehearsal: 1,400 requests, 0 errors, warm p95 0.740 s, warm median 0.415 s. Login p95 1.731 s.
- Each team solved all three practice challenges, with idempotent retry requests. The database contained exactly 300 solves.
- AES-256-GCM backup restored into an empty separate database: 101 accounts (100 teams and an organizer), 3 challenges, 300 solves.

The load test used Django's local threaded development server, 100 authenticated team sessions and up to 20 simultaneous in-flight request workers. Login ramp used 8 workers. It is not a benchmark of Render Free, a production SLA, or a claim about 100 simultaneous CPU-bound operations.

The backend Docker image builds, runs as the unprivileged app user, and passes readiness. Frontend lint, TypeScript checking, and the production build passed. All eight desktop/mobile browser scenarios passed (desktop rerun after fixing hydration timing). They cover audio/captions, login/logout, challenge submission, CSV import, proxy restrictions, and certificate verification. npm audit reported zero vulnerabilities. Screenshots are in `docs/screenshots/`.

Live hosting verification is pending deployment.
