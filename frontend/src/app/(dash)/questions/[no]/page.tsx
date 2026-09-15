
import { db } from "@/drizzle";
import { eq } from "drizzle-orm";
import { questionTable, userTable } from "@/drizzle/schema";
import { auth } from "@/functions/auth";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { Question } from "@/types/General";
import { assetsPanel, QuestionPanel } from "@/components/question-no";

export default async function Question({
  params,
}: {
  params: Promise<{ no: string }>;
}) {
  const no = (await params).no;
  const payload = await auth();

  const user = await db.query.userTable.findFirst({
    where: eq(userTable.id, payload.id),
  });

  const question = await db.query.questionTable.findFirst({
    where: eq(questionTable.no, parseInt(no)),
    with: {
      assets: {
        with: {
          transcript: {
            columns: {
              audio_id: true,
              transcript_id: true,
            },
          },
        },
      },
    },
  });

  console.log(question);

  if (!user) return <h1>It don't exist homedawg</h1>;
  if (!question) return <h1>It don't exist homedawg</h1>;
  if (user.progress < question.no) {
    return <h1>Nuh uh, you can't see that homedawg</h1>;
  }

  return (
    <>
      <div className="hidden md:block w-full">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel minSize={25} defaultSize={50}>
            <QuestionPanel
              type={true}
              question={question}
              attempt={user.progress == question.no}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel minSize={25} defaultSize={50}>
            {assetsPanel(question)}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <div className="md:hidden h-full">
        <QuestionPanel
          type={false}
          question={question}
          attempt={user.progress == question.no}
        />
        {assetsPanel(question)}
      </div>
    </>
  );
}

