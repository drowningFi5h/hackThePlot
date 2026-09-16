import Link from "next/link";
import { serverApi } from "@/lib/server-api";
import { ApiError, Challenge } from "@/lib/api";
import QuestionCard from "@/components/question-card";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
export default async function Questions() {
  let questions: Challenge[];
  try {
    questions = await serverApi<Challenge[]>("challenges/");
  } catch (e) {
    if (e instanceof ApiError && e.status === 403)
      return (
        <main className="p-8 text-white">
          <h1 className="text-2xl mb-4">The hunt is resting</h1>
          <p>{e.message}</p>
          <Link href="/questions" className="text-violet-400 underline">
            Check again
          </Link>
        </main>
      );
    throw e;
  }
  return (
    <BackgroundBeamsWithCollision>
      <main className="w-full h-screen overflow-auto p-6 md:p-10">
        <h1 className="text-white text-3xl font-bold mb-2">
          The plot thickens
        </h1>
        <p className="text-zinc-400 mb-8">
          Follow the clues. Each solve unlocks your next challenge.
        </p>
        {questions.length > 0 && questions.every((q) => q.solved) && (
          <p className="text-violet-400 mb-6">
            You solved every challenge. Well played!
          </p>
        )}
        {!questions.length && (
          <p className="text-zinc-400">
            Your organizers are preparing the challenges.
          </p>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      </main>
    </BackgroundBeamsWithCollision>
  );
}
