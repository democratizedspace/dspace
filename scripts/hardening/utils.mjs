import fs from 'fs';

/** @typedef {{ task: string; date: string; score: number }} HardeningHistoryEntry */
/** @typedef {{ passes: number; score: number; emoji: string; history: HardeningHistoryEntry[] }} Hardening */

export const HARDENING_EMOJIS = ['🛠️', '🌀', '✅', '💯'];

export const emojiThresholds = [
    { passes: 3, score: 90, emoji: '💯' },
    { passes: 2, score: 75, emoji: '✅' },
    { passes: 1, score: 60, emoji: '🌀' },
    { passes: 0, score: 0, emoji: '🛠️' },
];

export const defaultHardening = Object.freeze({
    passes: 0,
    score: 0,
    emoji: '🛠️',
    history: [],
});

export function clampScore(score) {
    const numeric = Number.isFinite(score) ? Math.round(score) : 0;
    return Math.min(100, Math.max(0, numeric));
}

export function computeEmoji(passes, score) {
    for (const threshold of emojiThresholds) {
        if (passes >= threshold.passes && score >= threshold.score) {
            return threshold.emoji;
        }
    }
    return '🛠️';
}

export function normalizeHistory(history) {
    if (!Array.isArray(history)) return [];
    return history.map((entry) => ({
        task: entry?.task ?? 'unspecified-task',
        date: typeof entry?.date === 'string' ? entry.date : '1970-01-01',
        score: clampScore(entry?.score ?? 0),
    }));
}

export function normalizeHardening(hardening, baselineScore = 0) {
    const normalizedHistory = normalizeHistory(hardening?.history ?? []);
    const normalizedScore = clampScore(
        Math.max(baselineScore, Number.isFinite(hardening?.score) ? hardening.score : 0)
    );
    const passes = normalizedHistory.length;
    const emoji = HARDENING_EMOJIS.includes(hardening?.emoji)
        ? hardening.emoji
        : computeEmoji(passes, normalizedScore);
    return {
        passes,
        score: normalizedScore,
        emoji,
        history: normalizedHistory,
    };
}

export function validateHardening(hardening) {
    const errors = [];
    if (!hardening) {
        errors.push('missing');
        return errors;
    }
    if (!Number.isInteger(hardening.passes) || hardening.passes < 0) {
        errors.push('passes must be a non-negative integer');
    }
    if (!Number.isInteger(hardening.score) || hardening.score < 0 || hardening.score > 100) {
        errors.push('score must be an integer between 0 and 100');
    }
    if (!HARDENING_EMOJIS.includes(hardening.emoji)) {
        errors.push('emoji invalid');
    }
    if (!Array.isArray(hardening.history)) {
        errors.push('history must be an array');
    } else {
        if (hardening.history.length !== hardening.passes) {
            errors.push('passes must equal history length');
        }
        for (const entry of hardening.history) {
            if (!entry.task || !entry.date || entry.score === undefined) {
                errors.push('history entry missing fields');
                break;
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
                errors.push(`history date invalid: ${entry.date}`);
                break;
            }
            if (!Number.isInteger(entry.score) || entry.score < 0 || entry.score > 100) {
                errors.push('history score invalid');
                break;
            }
        }
    }
    return errors;
}

function countOptions(dialogue, predicate) {
    let total = 0;
    for (const node of dialogue ?? []) {
        for (const option of node.options ?? []) {
            if (predicate(option)) {
                total += 1;
            }
        }
    }
    return total;
}

export function evaluateQuestQuality(quest) {
    if (!quest) return 0;
    let score = 10;
    const dialogue = Array.isArray(quest.dialogue) ? quest.dialogue : [];
    if (dialogue.length >= 4) {
        score += 25;
    } else if (dialogue.length >= 2) {
        score += 15;
    }

    const processOptions = countOptions(dialogue, (o) => Boolean(o.process));
    if (processOptions > 0) {
        score += Math.min(20, 10 + processOptions * 2);
    }

    const gatedOptions = countOptions(dialogue, (o) => Array.isArray(o.requiresItems) && o.requiresItems.length);
    if (gatedOptions) {
        score += Math.min(15, 5 + gatedOptions * 2);
    }

    const grantOptions = countOptions(dialogue, (o) => Array.isArray(o.grantsItems) && o.grantsItems.length);
    if (grantOptions) {
        score += Math.min(10, 5 + grantOptions);
    }

    if (Array.isArray(quest.rewards) && quest.rewards.length > 0) {
        score += 10;
    }

    const descriptionLength = quest.description?.length ?? 0;
    if (descriptionLength >= 240) {
        score += 10;
    } else if (descriptionLength >= 120) {
        score += 8;
    } else if (descriptionLength >= 60) {
        score += 5;
    }

    if (Array.isArray(quest.requiresQuests) && quest.requiresQuests.length) {
        score += 5;
    }

    const uniqueIds = new Set(dialogue.map((d) => d.id));
    if (uniqueIds.size === dialogue.length && dialogue.length > 0) {
        score += 5;
    }

    return clampScore(score);
}

export function evaluateProcessQuality(process) {
    if (!process) return 0;
    let score = 15;
    if (Array.isArray(process.requireItems) && process.requireItems.length) {
        score += 15;
    }
    if (Array.isArray(process.consumeItems) && process.consumeItems.some((c) => (c?.count ?? 0) > 0)) {
        score += 20;
    }
    if (Array.isArray(process.createItems) && process.createItems.length) {
        score += 20;
    }
    if (typeof process.duration === 'string' && process.duration.length) {
        score += process.duration.includes('h') ? 15 : 10;
    }
    if (process.image) {
        score += 5;
    }
    if (process.title?.length >= 40) {
        score += 5;
    }
    return clampScore(score);
}

export function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function writeJson(filePath, data) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 4)}\n`);
}
