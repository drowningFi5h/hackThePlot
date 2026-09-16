"use client";
import { useEffect, useState } from "react";
import srtParser2 from "srt-parser-2";
import AudioPlayer from "@/components/AudioPlayer";
export default function AudioCaptionPlayer({
  srt_url,
  audio_url,
  questionNumber,
}: {
  srt_url: string;
  audio_url: string;
  questionNumber: string;
}) {
  const [captions, setCaptions] = useState<ReturnType<srtParser2["fromSrt"]>>(
    [],
  );
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    fetch(srt_url, { signal: controller.signal, credentials: "omit" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Transcript unavailable");
        const text = await response.text();
        if (text.length > 500000) throw new Error("Transcript too large");
        return new srtParser2().fromSrt(text);
      })
      .then(setCaptions)
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => clearTimeout(timer));
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [srt_url]);
  return (
    <div>
      <AudioPlayer
        srt={captions}
        audio={audio_url}
        questionNumber={questionNumber}
      />
      {error && (
        <p className="text-zinc-400 mt-2 text-sm">
          Captions are unavailable. You can still play the audio.
        </p>
      )}
    </div>
  );
}
