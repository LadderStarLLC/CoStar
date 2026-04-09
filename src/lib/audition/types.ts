export type AuditionPhase =
  | 'setup'
  | 'requesting-permission'
  | 'connecting'
  | 'interviewing'
  | 'ending'
  | 'results';

export type InterviewType = 'technical' | 'behavioral' | 'mixed';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Duration = 5 | 10 | 15;
export type AIStatus = 'idle' | 'speaking' | 'listening' | 'processing';
export type MediaMode = 'voice' | 'video';

export interface AuditionConfig {
  interviewType: InterviewType;
  difficulty: Difficulty;
  durationMinutes: Duration;
  mediaMode: MediaMode;
}

export interface TranscriptEntry {
  id: string;
  role: 'ai' | 'user';
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export interface AuditionResults {
  transcript: TranscriptEntry[];
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  durationSeconds: number;
}
