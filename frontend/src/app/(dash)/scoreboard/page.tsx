import Scoreboard from "@/components/scoreboard";
import { BackgroundBeamsWithCollision } from "@/components/ui/background-beams-with-collision";
import { db } from "@/drizzle";
import { questionTable } from "@/drizzle/schema";
import calculateScore from "@/functions/individualScore";
import { auth } from "@/functions/auth";

const ScoreboardPage = async () => {
  const payload = await auth();
  const [questions, submissions, users] = await Promise.all([
    db.query.questionTable.findMany({
      columns: {
        flag: false
      }
    }),
    db.query.submissionTable.findMany({}),
    db.query.userTable.findMany({
      columns: {
        password: false
      }
    }),
  ]);

  const questionsWithSubmissions = questions.map((question) => {
    const questionSubmissions = submissions.filter(
      (submission) => submission.question_id === question.id,
    );
    return {
      ...question,
      submissions: questionSubmissions.length,
    };
  });


  const teams = users
    .map((user) => {
      const userSubmissions = submissions.filter(
        (submission) => submission.user_id === user.id,
      );
      let userScore = 0;
      for (let i = 1; i < user.progress; i++) {
        const question = questionsWithSubmissions.filter(
          (question) => question.no === i,
        )[0];
        const submission = userSubmissions.filter(
          (submission) => submission.question_id === question.id,
        )[0];
        if (submission) {
          const score: number = calculateScore(
            question.score,
            submission.position,
            question.submissions,
          );
          userScore += score;
        } 
      }
      return {
        ...user,
        score: userScore,
      };
    })
    .sort((a, b) => b.score - a.score);

    // check if payload.id is in top 10 teams or not
    const inIn10 = teams.slice(0,10).some((team) => team.id === payload.id);

  return (
    <BackgroundBeamsWithCollision>
      <Scoreboard
        teams={teams}
        submissions={submissions}
        questionsWithSubmissions={questionsWithSubmissions}
        userid={payload.id}
        inIn10={inIn10}
        isAdmin={payload.role === "admin"}
      />
    </BackgroundBeamsWithCollision>
  );
};

export default ScoreboardPage;
