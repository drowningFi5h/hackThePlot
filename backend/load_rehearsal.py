"""Synthetic local/staging rehearsal. Never run against a live competition."""

import argparse
import concurrent.futures
import json
import os
import statistics
import time
from pathlib import Path

import requests

parser = argparse.ArgumentParser()
parser.add_argument("--url", default="http://127.0.0.1:8000")
parser.add_argument("--teams", type=int, default=100)
parser.add_argument("--rounds", type=int, default=4)
parser.add_argument("--output", default="../docs/local-load-results.json")
args = parser.parse_args()
password = os.environ.get("DEMO_PASSWORD", "Demo-only-password-2026!")
base = args.url.rstrip("/") + "/api/v1/"
sessions = []
login_times = []
errors = []
samples = []


def login(n):
    session = requests.Session()
    csrf = session.get(base + "auth/csrf/", timeout=30).json()["csrfToken"]
    start = time.perf_counter()
    r = session.post(
        base + "auth/login/",
        json={"email": f"team{n}@example.test", "password": password},
        headers={"X-CSRFToken": csrf},
        timeout=60,
    )
    duration = time.perf_counter() - start
    r.raise_for_status()
    session.headers["X-CSRFToken"] = session.get(base + "auth/csrf/", timeout=30).json()[
        "csrfToken"
    ]
    return session, duration


with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
    for session, duration in pool.map(login, range(1, args.teams + 1)):
        sessions.append(session)
        login_times.append(duration)

flags = {0: "flag{first_clue}", 2: "flag{follow_the_trail}", 7: "flag{final_reveal}"}


def cycle(item):
    idx, session, round_no = item
    results = []

    def call(path, payload=None):
        start = time.perf_counter()
        r = (
            session.get(base + path, timeout=30)
            if payload is None
            else session.post(base + path, json=payload, timeout=30)
        )
        results.append((time.perf_counter() - start, r.status_code, path))
        return r

    try:
        call("leaderboard/")
        questions = call("challenges/").json()
        current = next((q for q in questions if q["unlocked"] and not q["solved"]), None)
        if current:
            call(f"challenges/{current['id']}/submit/", {"flag": flags[current["no"]]})
            # Retry simulates an uncertain response; it must not add another solve.
            call(f"challenges/{current['id']}/submit/", {"flag": flags[current["no"]]})
    except Exception as exc:
        results.append((30, 599, type(exc).__name__))
    return results


start = time.perf_counter()
with concurrent.futures.ThreadPoolExecutor(max_workers=20) as pool:
    for round_no in range(args.rounds):
        round_start = time.perf_counter()
        for result in pool.map(cycle, [(i, s, round_no) for i, s in enumerate(sessions)]):
            samples.extend(result)
        remaining = 15 - (time.perf_counter() - round_start)
        if remaining > 0 and round_no < args.rounds - 1:
            time.sleep(remaining)
durations = sorted(d for d, _, _ in samples)
failures = [{"status": status, "path": path} for _, status, path in samples if status >= 400]
report = {
    "environment": "local rehearsal; not a measurement of Render Free",
    "teams": args.teams,
    "rounds": args.rounds,
    "requests": len(samples),
    "elapsed_seconds": round(time.perf_counter() - start, 2),
    "warm_p95_seconds": round(durations[int(0.95 * (len(durations) - 1))], 3),
    "warm_median_seconds": round(statistics.median(durations), 3),
    "login_p95_seconds": round(sorted(login_times)[int(0.95 * (len(login_times) - 1))], 3),
    "error_percent": round(100 * len(failures) / len(samples), 3),
    "errors": failures[:10],
}
report["passes_http_targets"] = report["warm_p95_seconds"] < 2 and report["error_percent"] < 1
Path(args.output).write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
raise SystemExit(0 if report["passes_http_targets"] else 1)
