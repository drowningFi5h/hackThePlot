"use client";

import { useRef, useState, useEffect } from "react";
import srtParser2 from "srt-parser-2";
import Cookies from "js-cookie";
import { Button } from "./ui/button";
import { ChevronsUpDown, Pause, Play } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import React from "react";

export default function AudioPlayer({
  srt,
  audio,
  questionNumber,
}: {
  srt: ReturnType<typeof srtParser2.prototype.fromSrt>;
  audio: string;
  questionNumber: string;
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [srtIndex, setSrtIndex] = useState(0);
  const [isFirstPlay, setIsFirstPlay] = useState(true);
  const [isOpen, setIsOpen] = React.useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check if the audio has been fully played before for the given question
  useEffect(() => {
    const playedBefore = Cookies.get(`audioPlayed_${questionNumber}`);
    setIsFirstPlay(!playedBefore);

    if (audioRef.current) {
      // Set initial currentTime and duration when component mounts
      setCurrentTime(audioRef.current.currentTime || 0);
      setDuration(audioRef.current.duration || 0);
    }
  }, [questionNumber]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      setCurrentTime(current);

      srt.map((obj, index) => {
        if (current >= obj.startSeconds && current <= obj.endSeconds) {
          setSrtIndex(index);
        }
      });

      // Check if audio has been played completely
      if (current === duration) {
        Cookies.set(`audioPlayed_${questionNumber}`, "true", { expires: 1 });
        setIsFirstPlay(false);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = Number(event.target.value);
    if (!isFirstPlay || seekTime <= currentTime) {
      if (audioRef.current) {
        audioRef.current.currentTime = seekTime;
        setCurrentTime(seekTime);
      }
    }
  };

  // Format time in seconds to MM:SS format
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <div className="rounded-lg shadow-md">
        <audio
          ref={audioRef}
          src={audio}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
          className="hidden"
        />
        <div className="flex items-center w-full max-w-[40rem] mx-auto space-x-4 border text-white p-2 px-4 rounded-full">
          <Button
            onClick={handlePlayPause}
            className="ext-white hover:text-gray-300"
            variant="ghost"
            size="icon"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full max-w-md bg-gray-800 cursor-pointer opacity-75"
            disabled={isFirstPlay && currentTime < duration}
          />
          <div className="text-[0.70rem] tabular-nums whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="w-full space-y-2"
      >
        <div className="flex items-center justify-between space-x-4 px-4">
          <h4 className="text-sm font-semibold cursor-pointer" onClick={() => {setIsOpen((isOpen) => !isOpen)}}>Transcribe</h4>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-9 p-0 border !mr-auto">
              <ChevronsUpDown className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-2">
          {srt.map((obj, index) => {
            if (index <= srtIndex) {
              return (
                <div
                  key={index}
                  className={`p-2 rounded`}
                >
                  <div
                    className={`${
                      srtIndex === index ? "text-gray-500" : "text-gray-600"
                    }`}
                  >
                    {obj.text}
                  </div>
                </div>
              );
            }
          })}
        </CollapsibleContent>
      </Collapsible>
    </>
  );
}