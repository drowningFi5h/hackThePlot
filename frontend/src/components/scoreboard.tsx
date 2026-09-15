"use client";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import Progression from "@/components/progression";
import { Leaderboard } from "@/components/leaderboard";
import prepareChartData from "@/functions/prepareChartData";
import { Question, submission } from "@/types/General";
import { Teams } from "@/types/General";

interface QuestionWithSubmissions extends Question {
  submissions: number;
}

const scoreboard = (props: {
  userid: string;
  teams: Teams[];
  submissions: submission[];
  questionsWithSubmissions: QuestionWithSubmissions[];
  inIn10: boolean;
  isAdmin: boolean;
}) => {
  const chartData = prepareChartData(
    props.teams,
    props.submissions,
    props.questionsWithSubmissions,
  );

  return (
    <div className="min-h-screen h-screen w-screen overflow-auto bg-black rounded-md text-gray-200 p-8">
      <TextGenerateEffect words="Scorecard" />
      <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-6 py-8 px-4">
        <div className="h-full w-full rounded-xl border border-zinc-800 p-4">
          <h3 className="text-xl font-bold text-white m-2 mb-8">Progression</h3>
          <div className="w-full h-[500px] p-2">
            <Progression chartData={chartData} />
          </div>
        </div>
        <div className="h-full w-full rounded-xl border border-zinc-800 p-4">
          <h3 className="text-xl font-bold text-white m-2 mb-4">Leaderboard ({props.teams.length} teams)</h3>
          <div className="w-full h-full p-2">
            <Leaderboard teams={props.teams} userid={props.userid} inIn10={props.inIn10} isAdmin={props.isAdmin}/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default scoreboard;
