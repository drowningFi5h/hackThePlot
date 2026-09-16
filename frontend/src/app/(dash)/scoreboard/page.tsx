import Scoreboard from "@/components/scoreboard";
import { serverApi } from "@/lib/server-api";
import type { Board } from "@/lib/api";
export default async function ScoreboardPage() {
  return <Scoreboard initial={await serverApi<Board>("leaderboard/")} />;
}
