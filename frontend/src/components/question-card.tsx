import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Lock, CheckCircle } from "lucide-react";
import { Question } from "@/types/General";
import Link from "next/link";
import { HoverBorderGradient } from "./ui/hover-border-gradient";

const QuestionCard = (props: { question: Question; progress: number }) => {
  const question: Question = props.question;
  const progress: number = props.progress;

  return (
    <Card key={question.id} className="bg-black border-gray-1000 shadow-xl ">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white flex items-center justify-between">
          {question.title}
          {question.no < progress && <CheckCircle className="text-[#8b5cf6]" />}
          {question.no > progress && <Lock className="text-gray-500" />}
        </CardTitle>
        <CardDescription className="text-gray-400">
          {question.score} points
        </CardDescription>
      </CardHeader>
      <CardContent>
        {question.no < progress && <p className="text-[#8b5cf6]">Solved!</p>}
        {question.no == progress && (
          <Link href={`/questions/${question.no}`} className="bg-none">
            <HoverBorderGradient
              containerClassName="rounded-full"
              as="button"
              className="bg-black text-black dark:text-white flex items-center space-x-4 px-8 sm:w-full"
            >
              <span className="w-full bg-black hover:bg-black text-white">
                Attempt
              </span>
            </HoverBorderGradient>
          </Link>
        )}
        {question.no > progress && (
          <p className="text-gray-500">Solve previous questions to unlock</p>
        )}
      </CardContent>
    </Card>
  );
};

export default QuestionCard;
