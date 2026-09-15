import { Question } from "@/types/General";
import calculateScore from "./individualScore";
import { Teams } from "@/types/General";

type Submission = {
  time: string;
  id: string;
  question_id: string;
  user_id: string;
  position: number;
};

interface QuestionWithSubmissions extends Question {
  submissions: number;
};

type ChartDataPoint = { [key: string]: number | string };

export default function generateChartData(
  teams: Teams[],
  submissions: Submission[],
  questionsWithSubmissions: QuestionWithSubmissions[],
): ChartDataPoint[] {
  const topTeams = teams.sort((a, b) => b.score - a.score).slice(0, 10);

  const teamScoresOverTime: { [key: string]: number } = {};
  topTeams.forEach((team) => {
    teamScoresOverTime[team.id] = 0;
  });

  const chartData: ChartDataPoint[] = [];

  const sortedSubmissions = submissions.sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );

  sortedSubmissions.forEach((submission) => {
    const question = questionsWithSubmissions.find(
      (q) => q.id === submission.question_id,
    );
    const team = topTeams.find((t) => t.id === submission.user_id);

    if (!question || !team) return;

    const score = calculateScore(
      question.score,
      submission.position,
      question.submissions,
    );

    teamScoresOverTime[team.id] += score;

    const dataPoint: ChartDataPoint = {
      time: new Date(submission.time).toTimeString().split(' ')[0],
    };
    topTeams.forEach((t) => {
      dataPoint[t.username] = teamScoresOverTime[t.id];
    });
    chartData.push(dataPoint);
  });

  return chartData;
}
