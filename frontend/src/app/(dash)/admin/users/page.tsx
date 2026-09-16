"use client";
import { useState, useSyncExternalStore } from "react";
import Papa from "papaparse";
import { api, Board } from "@/lib/api";
import type { components } from "@/types/api";
type Row = { username: string; email: string };
type Result = components["schemas"]["ImportOutput"];
const subscribe = () => () => {};
export default function TeamImport() {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [rows, setRows] = useState<Row[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [reset, setReset] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [certificateUrls, setCertificateUrls] = useState<string[]>([]);
  async function run(dry_run: boolean) {
    setBusy(true);
    setError("");
    try {
      setResult(
        await api<Result>("admin/teams/import/", {
          method: "POST",
          body: JSON.stringify({ rows, dry_run, reset_existing: reset }),
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (!result) return;
    const csv = Papa.unparse(result.rows, { escapeFormulae: true });
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "techhunt-team-credentials.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <main className="p-6 md:p-10 h-screen overflow-auto w-full text-white bg-black">
      <h1 className="text-3xl mb-3">Team registration</h1>
      <p className="text-zinc-400 mb-8">
        Upload a CSV with username,email columns. Original Team Name and
        Candidate&apos;s Email headers also work. Passwords are generated here.
      </p>
      <input
        disabled={!ready}
        aria-label="Team CSV"
        type="file"
        accept=".csv,text/csv"
        onChange={(e) => {
          setResult(null);
          setError("");
          setRows([]);
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 1024 * 1024) {
            setError("CSV must be smaller than 1 MB.");
            return;
          }
          Papa.parse<Record<string, string>>(file, {
            header: true,
            skipEmptyLines: "greedy",
            complete: (parsed) => {
              if (parsed.errors.length) {
                setError(parsed.errors.map((e) => e.message).join("; "));
                return;
              }
              setRows(
                parsed.data.map((r) => ({
                  username: r.username || r["Team Name"] || "",
                  email: r.email || r["Candidate's Email"] || "",
                })),
              );
            },
          });
        }}
      />
      <label className="block my-6 text-sm">
        <input
          type="checkbox"
          checked={reset}
          onChange={(e) => {
            setReset(e.target.checked);
            setResult(null);
          }}
        />{" "}
        Explicitly reset passwords for existing teams
      </label>
      <div className="flex gap-3 flex-wrap">
        <button
          className="border rounded px-5 py-2"
          disabled={!rows.length || busy}
          onClick={() => run(true)}
        >
          Validate import
        </button>
        {result?.dry_run && (
          <button
            className="border border-violet-400 rounded px-5 py-2"
            disabled={busy}
            onClick={() => run(false)}
          >
            Create / update teams
          </button>
        )}
        {result && !result.dry_run && (
          <button
            className="border border-green-400 rounded px-5 py-2"
            onClick={download}
          >
            Download credentials once
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-red-400 mt-5">
          {error}
        </p>
      )}
      {result && (
        <div className="my-8">
          <h2 className="text-xl mb-4">
            {result.dry_run
              ? "Validation preview"
              : "Import complete â€” save credentials before leaving"}
          </h2>
          <table className="w-full text-left text-sm">
            <thead>
              <tr>
                <th>Team</th>
                <th>Email</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r) => (
                <tr key={r.email} className="border-t border-zinc-800">
                  <td className="py-3">{r.username}</td>
                  <td>{r.email}</td>
                  <td>{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <section className="border-t border-zinc-800 mt-12 pt-8">
        <h2 className="text-xl mb-3">Certificates</h2>
        <p className="text-zinc-400 mb-4">
          Available after the event ends. Links verify against the backend until
          it is shut down.
        </p>
        <button
          className="border rounded px-5 py-2"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const board = await api<Board>("leaderboard/");
              const urls: string[] = [];
              for (const team of board.teams) {
                const result = await api<{ url: string }>(
                  "admin/certificates/",
                  {
                    method: "POST",
                    body: JSON.stringify({ team_id: team.id }),
                  },
                );
                urls.push(result.url);
              }
              setCertificateUrls(urls);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Issuance failed.");
            } finally {
              setBusy(false);
            }
          }}
        >
          Issue team certificates
        </button>
        <div className="mt-5 space-y-2">
          {certificateUrls.map((url) => (
            <a className="block text-violet-400 break-all" key={url} href={url}>
              {url}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
