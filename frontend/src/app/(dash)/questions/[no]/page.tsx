import { serverApi } from "@/lib/server-api";
import type { Challenge } from "@/lib/api";
import { auth } from "@/functions/auth";
import { QuestionPanel, assetsPanel } from "@/components/question-no";
export default async function Question({
  params,
}: {
  params: Promise<{ no: string }>;
}) {
  const no = (await params).no;
  const [question, user] = await Promise.all([
    serverApi<Challenge>("challenges/" + encodeURIComponent(no) + "/"),
    auth(),
  ]);
  return (
    <main className="w-full h-screen overflow-auto grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      <QuestionPanel
        question={question}
        attempt={!question.solved && user.role !== "admin"}
      />
      {assetsPanel(question)}
    </main>
  );
}
