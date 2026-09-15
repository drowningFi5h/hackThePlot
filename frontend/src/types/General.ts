export interface Question {
  title: string;
  id: string;
  no: number;
  question: string | null;
  flag?: string | null;
  score: number;
  assets?: {
    type: "audio" | "video" | "image" | "zip" | "pdf" | "srt" | "url";
    id: string;
    url: string;
    name: string;
    question_id: string;
    downloadable: boolean;
    transcript?: {
      audio_id: string;
      transcript_id: string;
    };
  }[];
}

export interface submission {
  id: string;
  time: string;
  position: number;
  question_id: string;
  user_id: string;
  question?: Question;
}

export interface Teams {
  score: number;
  progress: number;
  id: string;
  username: string;
  email: string;
  password?: string;
  role: "participant" | "admin";
}