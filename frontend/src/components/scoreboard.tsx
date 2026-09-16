"use client";
import { useEffect, useState } from "react";
import { api, Board } from "@/lib/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
const colors = [
  "#8b5cf6",
  "#22d3ee",
  "#f472b6",
  "#facc15",
  "#4ade80",
  "#fb923c",
  "#a78bfa",
  "#f87171",
  "#2dd4bf",
  "#e879f9",
];
export default function Scoreboard({ initial }: { initial: Board }) {
  const [board, setBoard] = useState(initial);
  const [error, setError] = useState("");
  useEffect(() => {
    let stopped = false,
      delay = 15000;
    let timer: ReturnType<typeof setTimeout>;
    async function poll() {
      if (stopped) return;
      if (document.visibilityState === "visible") {
        try {
          const next = await api<Board>("leaderboard/");
          if (!stopped) {
            setBoard(next);
            setError("");
          }
          delay = 15000;
        } catch {
          if (!stopped)
            setError("Live updates paused. Retrying automatically…");
          delay = Math.min(delay * 2, 120000);
        }
      }
      if (!stopped) timer = setTimeout(poll, delay);
    }
    timer = setTimeout(poll, delay);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);
  const times = [
    ...new Set(board.series.flatMap((s) => s.points.map((p) => p.time))),
  ].sort();
  const chart = times.map((time) => {
    const row: Record<string, number | string> = {
      time: new Date(time).getTime(),
    };
    for (const series of board.series)
      row[series.id] =
        series.points.filter((p) => p.time <= time).at(-1)?.score ?? 0;
    return row;
  });
  return (
    <main className="min-h-screen h-screen w-full overflow-auto bg-black text-white p-6 md:p-10">
      <h1 className="text-3xl font-bold mb-2">Scorecard</h1>
      <p className="text-zinc-400 mb-8">
        Every solve changes the standings. Updates every 15 seconds.
      </p>
      {error && (
        <p role="status" className="text-amber-400 mb-4">
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="border border-zinc-800 rounded-lg p-5">
          <h2 className="text-xl mb-5">Progression</h2>
          <p className="text-xs text-zinc-500 mb-4">
            Cumulative solves valued at current pool shares.
          </p>
          <div className="h-80">
            {chart.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <CartesianGrid stroke="#27272a" />
                  <XAxis
                    dataKey="time"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(value) =>
                      new Date(value).toLocaleTimeString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) =>
                      new Date(Number(value)).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                      })
                    }
                  />
                  <Legend />
                  {board.series.map((s, i) => (
                    <Line
                      key={s.id}
                      dataKey={s.id}
                      name={s.name}
                      stroke={colors[i % colors.length]}
                      type="stepAfter"
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-zinc-500 pt-10">
                The first solve starts the story.
              </p>
            )}
          </div>
        </section>
        <section className="border border-zinc-800 rounded-lg p-5 overflow-auto">
          <h2 className="text-xl mb-5">
            Leaderboard ({board.teams.length} teams)
          </h2>
          <table className="w-full text-sm">
            <thead className="text-zinc-400 text-left">
              <tr>
                <th className="pb-4">Rank</th>
                <th>Team</th>
                <th>Solved</th>
                <th className="text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {board.teams.map((t) => (
                <tr key={t.id} className="border-t border-zinc-800">
                  <td className="py-4 text-violet-400">{t.rank}</td>
                  <td>{t.username}</td>
                  <td>{t.solved}</td>
                  <td className="text-right font-mono">{t.score.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
