import { db } from "@/drizzle";
import { asc, eq } from "drizzle-orm";
import { questionTable, submissionTable, userTable } from "@/drizzle/schema";
import { auth } from "@/functions/auth";
import QuestionCard from "@/components/question-card";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";

export default async function Questions() {
  const payload = await auth();
  const [questions, completed] = await Promise.all([
    db.query.questionTable.findMany({
      orderBy: [asc(questionTable.no)],
    }),
    db.query.submissionTable.findMany({
      where: eq(submissionTable.user_id, payload.id),
      with: {
        question: true,
      },
    }),
  ]);

  const user = await db.query.userTable.findFirst({
    where: eq(userTable.id, payload.id),
  });

  return (
    <BackgroundBeamsWithCollision>
      <div className="min-h-screen h-screen overflow-auto w-screen text-gray-200 p-8">
        <div className="text-8xl relative font-extrabold mb-8 text-center font-bold text-white text-transparent bg-clip-text bg-no-repeat bg-gradient-to-r py-4 from-purple-500 via-violet-500 to-pink-500 [text-shadow:0_0_rgba(0,0,0,0.1)]">
          <h1 className="opacity-[.10] text-center overflow-hidden whitespace-nowrap pb-4">
            13 Reasons Why
          </h1>
          <span className="absolute left-0 right-0 bottom-4 m-auto text-6xl opacity-[0.80]">
            The Hunt
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questions.map((question) => (
            <QuestionCard
              question={question}
              progress={user?.progress || 0}
              key={question.id}
            />
          ))}
        </div>
      </div>
    </BackgroundBeamsWithCollision>
  );
}
