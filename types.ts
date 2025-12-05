export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface GenerationState {
  status: AppStatus;
  output: string;
  error?: string;
}

export interface TranscriptPayload {
  text: string;
}

export type AiProvider = 'GEMINI' | 'OPENROUTER';

export interface AppSettings {
  provider: AiProvider;
  geminiKey: string;
  openRouterKey: string;
}
