export type AuditionPhase =
  | 'setup'
  | 'requesting-permission'
  | 'connecting'
  | 'interviewing'
  | 'ending'
  | 'results';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type AIStatus = 'idle' | 'speaking' | 'listening' | 'processing';
export type MediaMode = 'voice' | 'video';

export interface AuditionConfig {
  difficulty: Difficulty;
  numQuestions: number;
  mediaMode: MediaMode;
  focus?: string;
  resume?: string;
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

export interface AuditionPreset {
  id: string;
  name: string;
  config: AuditionConfig;
}

export interface AuditionSession {
  id: string;
  userId: string;
  date: string;
  status: 'in-progress' | 'completed' | 'cancelled' | 'deleted';
  startedAt: string;
  endedAt?: string;
  mode: 'freeform' | 'job';
  jobTitle: string;
  companyName: string;
  jobId?: string;
  config: AuditionConfig & { voiceName?: string };
  transcript: TranscriptEntry[];
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  durationSeconds: number;
  ultraFeedback?: string;
  deletedAt?: any;
  deletedBy?: string | null;
  deletionReason?: string | null;
  deleteSource?: 'user' | 'admin' | 'retention' | 'preview';
  walletMeterId?: string;
  walletTransactionId?: string;
  walletSettlementTransactionId?: string | null;
}
