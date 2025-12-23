export interface HardeningHistoryEntry {
    task: string;
    date: string;
    score: number;
}

export interface Hardening {
    passes: number;
    score: number;
    emoji: string;
    history: HardeningHistoryEntry[];
}

export const HARDENING_EMOJIS: readonly string[];
export const emojiThresholds: ReadonlyArray<{ passes: number; score: number; emoji: string }>;
export const defaultHardening: Readonly<Hardening>;
export function clampScore(score: number): number;
export function computeEmoji(passes: number, score: number): string;
export function normalizeHistory(history: any): HardeningHistoryEntry[];
export function normalizeHardening(hardening: Partial<Hardening> | undefined, baselineScore?: number): Hardening;
export function validateHardening(hardening: Hardening): string[];
export function evaluateQuestQuality(quest: any): number;
export function evaluateProcessQuality(process: any): number;
export function readJson<T = any>(filePath: string): T;
export function writeJson(filePath: string, data: any): void;
