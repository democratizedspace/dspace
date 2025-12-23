export type HardeningEmoji = '🛠️' | '🌀' | '✅' | '💯';
export interface HardeningHistoryEntry {
    task: string;
    date: string;
    score: number;
}
export interface Hardening {
    passes: number;
    score: number;
    emoji: HardeningEmoji;
    history: HardeningHistoryEntry[];
}

export const HARDENING_EMOJIS: HardeningEmoji[];
export const defaultHardening: Hardening;
export function clampScore(rawScore?: number): number;
export function emojiForHardening(hardening: Hardening): HardeningEmoji;
export function validateHardening(hardening: Partial<Hardening>): string[];
export function normalizeHardening(
    hardening: Partial<Hardening>,
    options?: { minimumScore?: number }
): Hardening;
export function evaluateQuestQuality(quest: Record<string, any>): number;
export function evaluateProcessQuality(process: Record<string, any>): number;
export function hardeningStatusText(hardening: Hardening): string;
