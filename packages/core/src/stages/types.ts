import type { OutputLanguage } from '../language.js';

export const SUPPORTED_LEVELS = ['beginner', 'intermediate', 'expert'] as const;

export type Level = (typeof SUPPORTED_LEVELS)[number];

export const DEFAULT_LEVEL: Level = 'intermediate';

export interface StageContext {
  language: OutputLanguage;
  level: Level;
  soulPrompt: string;
}
