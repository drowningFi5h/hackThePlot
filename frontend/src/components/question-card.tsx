import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, CheckCircle } from "lucide-react";
import type { Challenge } from "@/lib/api";
import Link from "next/link";
export default function QuestionCard({ question }: { question: Challenge }) {
  return (
    <Card className="bg-black border-zinc-800 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl text-white flex justify-between">
          {question.title}
          {question.solved ? (
            <CheckCircle className="text-violet-400" />
          ) : !question.unlocked ? (
            <Lock className="text-zinc-500" />
          ) : null}
        </CardTitle>
        <CardDescription className="text-zinc-400">
          {question.score} point pool
        </CardDescription>
      </CardHeader>
      <CardContent>
        {question.unlocked ? (
          <Link
            className="inline-block rounded-full border border-violet-400/50 px-6 py-2 text-violet-300 hover:bg-violet-500/10"
            href={"/questions/" + question.no}
          >
            {question.solved ? "Solved · revisit" : "Attempt"}
          </Link>
        ) : (
          <p className="text-zinc-500">Solve previous questions to unlock</p>
        )}
      </CardContent>
    </Card>
  );
}
