import AudioCaptionPlayer from "@/components/AudioCaptionPlayer";
import FlagForm from "./FlagForm";
import type { Challenge } from "@/lib/api";
export function assetsPanel(question: Challenge) {
  const assets = question.assets.filter((a) => a.downloadable);
  return (
    <section className="rounded-lg border border-zinc-800 bg-black p-6 h-full">
      <h2 className="text-lg font-semibold mb-5 text-white">Assets</h2>
      {!assets.length && (
        <p className="text-zinc-500">No downloads for this challenge.</p>
      )}
      <div className="space-y-3">
        {assets.map((a) => (
          <a
            key={a.id}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-zinc-800 hover:border-violet-500 rounded-lg p-4 text-violet-300"
          >
            {a.name}{" "}
            <span className="text-zinc-500 text-xs uppercase">{a.type}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
export function QuestionPanel({
  question,
  attempt,
}: {
  question: Challenge;
  attempt: boolean;
  type?: boolean;
}) {
  return (
    <section className="rounded-lg border border-zinc-800 bg-black text-white flex flex-col h-full">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-xl font-semibold">
          {question.no}. {question.title}
        </h1>
        <p className="whitespace-pre-wrap text-zinc-400 mt-4">
          {question.question}
        </p>
        <p className="text-sm text-violet-400 mt-4">
          {question.score} point pool
        </p>
      </div>
      <div className="p-6 flex-1 space-y-5">
        {question.assets
          .filter((a) => !a.downloadable)
          .map((a) =>
            a.type === "audio" && a.transcript_url ? (
              <AudioCaptionPlayer
                key={a.id}
                audio_url={a.url}
                srt_url={a.transcript_url}
                questionNumber={String(question.no)}
              />
            ) : a.type === "audio" ? (
              <audio key={a.id} controls src={a.url} className="w-full" />
            ) : a.type === "video" ? (
              <video key={a.id} controls src={a.url} className="w-full" />
            ) : (
              <a
                key={a.id}
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-violet-400 underline"
              >
                {a.name}
              </a>
            ),
          )}
      </div>
      {attempt && (
        <div className="p-5 border-t border-zinc-800">
          <FlagForm question={question} />
        </div>
      )}
    </section>
  );
}
