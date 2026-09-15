import srtParser2 from "srt-parser-2";
import AudioPlayer from "@/components/AudioPlayer";

async function loadSrtFromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  return await response.text();
}

export default async function AudioCaptionPlayer({
  srt_url,
  audio_url,
  questionNumber
}: {
  srt_url: string;
  audio_url: string;
  questionNumber: string;
}) {
  const srt = await loadSrtFromUrl(srt_url);
  let parser = new srtParser2();
  let srt_array = parser.fromSrt(srt);

  return <AudioPlayer srt={srt_array} audio={audio_url} questionNumber={questionNumber}/>;
}
