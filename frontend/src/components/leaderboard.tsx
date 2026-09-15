"use client";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Teams } from "@/types/General";

export function Leaderboard(props: {
  teams: Teams[];
  userid: string;
  inIn10: boolean;
  isAdmin: boolean;
}) {
  const myTeamIndex = props.teams.findIndex((team) => team.id === props.userid);
const myteam = props.teams[myTeamIndex];
  return (
    <Table>
      {/* <TableCaption>A list of your recent invoices.</TableCaption> */}
      <TableHeader>
        <TableRow>
          <TableHead>Rank</TableHead>
          <TableHead>Team Name</TableHead>
          <TableHead>Ques</TableHead>
          <TableHead className="text-right">Score</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="h-full">
        {props.teams.slice(0, !props.isAdmin ? 10 : props.teams.length).map((team, index) => (
          <TableRow key={team.id} className="mb-4">
            <TableCell className="font-medium">{index + 1}</TableCell>
            <TableCell title={team.username}>
              {team.username.slice(0, 12)}
            </TableCell>
            <TableCell>{team.progress}</TableCell>
            <TableCell className="text-right">{team.score.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      {/* if user is not in top 10, show */}
      {!props.isAdmin && !props.inIn10 && (
        <TableFooter>
          <TableRow>
            <TableCell>{myTeamIndex+1}</TableCell>
            <TableCell>{myteam.username}</TableCell>
            <TableCell>{myteam.progress}</TableCell>
            <TableCell className="text-right">{myteam.score.toFixed(2)}</TableCell>
          </TableRow>
        </TableFooter>
      )}
    </Table>
  );
}
