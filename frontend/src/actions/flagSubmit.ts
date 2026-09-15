"use server";

import { db } from "@/drizzle";
import { eq } from "drizzle-orm";
import { questionTable, submissionTable, userTable } from "@/drizzle/schema";
import { Errors } from "@/classes/Errors";
import { auth } from "@/functions/auth";
import { DateTime } from "luxon";

export async function flagSubmit(questionID: string, flag: string) {
  try {
    const payload = await auth();
    try {
      const [question, user] = await Promise.all([
        db.query.questionTable.findFirst({
          where: eq(questionTable.id, questionID),
        }),
        db.query.userTable.findFirst({
          where: eq(userTable.id, payload.id),
        }),
      ]);

      if (!question) return Errors.NotFound("Question doesn't exist");
      if (!user) return Errors.NotFound("User doesn't exist");

      if (user.progress < question.no) {
        return Errors.Unsuccessful("You can't submit for this question");
      }

      if (!question) return Errors.NotFound("Question doesn't exist");

      if (question.flag !== flag) {
        return Errors.Unsuccessful("Wrong Answer!");
      }

      const currentTime = DateTime.now();
      const postgresTimestamp = currentTime.toISO();

      await db.transaction(async (tx) => {
        const submissionCount = await tx.$count(
          submissionTable,
          eq(submissionTable.question_id, questionID),
        );
        await tx.insert(submissionTable).values({
          question_id: questionID,
          user_id: payload.id,
          position: submissionCount + 1,
          time: postgresTimestamp,
        });
        await tx
          .update(userTable)
          .set({
            progress: question.no + 1,
          })
          .where(eq(userTable.id, payload.id));
      });
      return {
        message: "Correct Answer!",
        error: false,
      };
    } catch (e) {
      return Errors.DBError(e);
    }
  } catch (e) {
    return Errors.AuthError(e);
  }
}
