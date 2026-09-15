import { ScrollArea } from "@/components/ui/scroll-area";
import AudioCaptionPlayer from "@/components/AudioCaptionPlayer";
import {
  Card,
  CardTitle,
  HoverEffect,
} from "@/components/ui/card-hover-effect";
import { db } from "@/drizzle";
import { transcriptTable } from "@/drizzle/schema";
import { Question } from "@/types/General";
import { eq } from "drizzle-orm";
import FlagForm from "./FlagForm";
import { CardHeader, CardContent } from "./ui/card";

export const assetsPanel = (question: Question) => {
  const assets = question.assets?.map((asset) => {
    if (asset.downloadable && !asset.transcript) {
      return {
        type: asset.type,
        url: asset.url,
      };
    }
  });
  return (
    <Card className="min-h-[50%] h-fit md:h-full p-0 rounded-lg z-0 overflow-auto">
      <CardHeader>
        <CardTitle>Assets</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-full">
          {assets && assets.length > 0 ? <HoverEffect items={assets} /> : null}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export const QuestionPanel = (props: {
  type: boolean;
  question: Question;
  attempt: boolean;
}) => {
  return (
    <div
      className={`flex flex-col ${
        props.type ? "h-full" : "min-h-[60%] max-h-[80%]"
      } bg-black border border-zinc-800 rounded-lg text-white`}
    >
      <div className="p-6 px-8 border-b border-zinc-800">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white opacity-75">
            {props.question.no}.
          </span>
          <h1 className="text-xl font-semibold">{props.question.title}</h1>
        </div>
        {props.question.question && (
          <div className="mt-1 text-sm text-zinc-400 mb-4 break-words">
            {props.question.question}
          </div>
        )}
        <div className="mt-1 text-sm text-zinc-400">
          Points: <span className="text-[#8b5cf6]">{props.question.score}</span>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4 overflow-auto">
        <div className="space-y-4">
          {props.question.assets?.map(async (asset) => {
            if (
              asset.type == "audio" &&
              !asset.downloadable &&
              asset.transcript
            ) {
              const transcript = await db.query.transcriptTable.findFirst({
                where: eq(transcriptTable.audio_id, asset.transcript.audio_id),
                with: {
                  audio: {
                    columns: {
                      url: true,
                    },
                  },
                  transcript: {
                    columns: {
                      url: true,
                    },
                  },
                },
              });
              if (!transcript) return null;
              return (
                <AudioCaptionPlayer
                  key={asset.id}
                  srt_url={transcript.transcript.url}
                  audio_url={transcript.audio.url}
                  questionNumber={props.question.no.toString()}
                />
              );
            }
          })}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-zinc-800 mt-auto">
        {props.attempt && (
          <FlagForm type={props.type} question={props.question} />
        )}
      </div>
    </div>
  );
};
