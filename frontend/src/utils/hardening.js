// @ts-check

export const HARDENING_EMOJIS = ['🛠️', '🌀', '✅', '💯'];
export const HARDENING_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const DEFAULT_HARDENING = Object.freeze({
    passes: 0,
    score: 0,
    emoji: '🛠️',
    history: [],
});

const clampScore = (score) => {
    const numericScore = Number.isFinite(score) ? score : 0;
    return Math.min(100, Math.max(0, Math.round(numericScore)));
};

export const emojiForHardening = (passes, score) => {
    if (passes >= 3 && score >= 90) {
        return '💯';
    }
    if (passes >= 2 && score >= 75) {
        return '✅';
    }
    if (passes >= 1 && score >= 60) {
        return '🌀';
    }
    return '🛠️';
};

const normalizeHistory = (history = []) => {
    if (!Array.isArray(history)) {
        return [];
    }

    return history
        .filter((entry) => entry && typeof entry === 'object')
        .map((entry) => ({
            task: String(entry.task ?? '').trim(),
            date: String(entry.date ?? '').trim(),
            score: clampScore(entry.score ?? 0),
        }))
        .filter((entry) => entry.task && entry.date && HARDENING_DATE_REGEX.test(entry.date));
};

export const normalizeHardening = (hardening, options = {}) => {
    const base = hardening && typeof hardening === 'object' ? hardening : DEFAULT_HARDENING;
    const history = normalizeHistory(base.history);
    const passes = history.length;

    const normalizedScore = clampScore(base.score ?? DEFAULT_HARDENING.score);
    const expectedScore =
        options.expectedScore !== undefined ? clampScore(options.expectedScore) : normalizedScore;
    const score = Math.max(normalizedScore, expectedScore);

    const emoji = emojiForHardening(passes, score);

    return { passes, score, emoji, history };
};

export const validateHardening = (hardening, expectedScore) => {
    const issues = [];

    if (!hardening) {
        issues.push('missing hardening block');
        return issues;
    }

    const { passes, score, emoji, history } = hardening;
    const historyEntries = Array.isArray(history)
        ? history.filter((entry) => entry && typeof entry === 'object')
        : [];

    if (!Number.isInteger(passes) || passes < 0) {
        issues.push('passes must be a non-negative integer');
    }

    const clampedScore = clampScore(score);

    if (!Number.isInteger(score) || score < 0 || score > 100) {
        issues.push('score must be an integer between 0 and 100');
    }

    historyEntries.forEach((entry, idx) => {
        if (!entry.task) {
            issues.push(`history[${idx}] task is required`);
        }
        if (!HARDENING_DATE_REGEX.test(String(entry.date ?? ''))) {
            issues.push(`history[${idx}] has invalid date format`);
        }
        if (!Number.isInteger(entry.score) || entry.score < 0 || entry.score > 100) {
            issues.push(`history[${idx}] score must be an integer between 0 and 100`);
        }
    });

    if (historyEntries.length !== passes) {
        issues.push('passes must equal history length');
    }

    const normalized = normalizeHardening(hardening, {
        expectedScore,
    });
    const expectedEmoji = emojiForHardening(normalized.passes, normalized.score);

    if (!HARDENING_EMOJIS.includes(emoji)) {
        issues.push(`emoji must be one of ${HARDENING_EMOJIS.join(', ')}`);
    }

    if (emoji && emoji !== expectedEmoji) {
        issues.push('emoji must match hardening thresholds');
    }

    if (expectedScore !== undefined && clampedScore < clampScore(expectedScore)) {
        issues.push('score must meet or exceed the evaluator output');
    }

    return issues;
};

const durationToSeconds = (durationString) => {
    if (!durationString || typeof durationString !== 'string') {
        return 0;
    }
    const regex = /(\d*\.?\d+)([dhms])/gi;
    let durationSeconds = 0;
    let match;
    while ((match = regex.exec(durationString)) !== null) {
        const number = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        switch (unit) {
            case 'd':
                durationSeconds += number * 86400;
                break;
            case 'h':
                durationSeconds += number * 3600;
                break;
            case 'm':
                durationSeconds += number * 60;
                break;
            case 's':
                durationSeconds += number;
                break;
            default:
                break;
        }
    }
    return durationSeconds;
};

export const evaluateProcessQuality = (process) => {
    if (!process) {
        return 0;
    }

    let score = 0;

    if (process.title && process.title.trim().length >= 8) {
        score += 20;
    } else if (process.title) {
        score += 10;
    }

    const durationSeconds = durationToSeconds(process.duration);
    if (durationSeconds > 0) {
        score += 25;
        if (durationSeconds >= 30) {
            score += 10;
        }
        if (durationSeconds >= 1800 && durationSeconds <= 259200) {
            score += 10;
        }
    }

    const relationshipKeys = ['requireItems', 'consumeItems', 'createItems'];
    const populatedRelationships = relationshipKeys.filter(
        (key) => Array.isArray(process[key]) && process[key].length > 0
    );

    if (populatedRelationships.length > 0) {
        score += 20;
        score += populatedRelationships.length * 5;
    }

    if (process.image) {
        score += 5;
    }

    return clampScore(score);
};

export const evaluateQuestQuality = (quest) => {
    if (!quest) {
        return 0;
    }

    let score = 0;
    if (quest.title && quest.title.trim().length >= 10) {
        score += 15;
    } else if (quest.title) {
        score += 8;
    }

    if (quest.description && quest.description.trim().length >= 80) {
        score += 15;
    } else if (quest.description && quest.description.trim().length >= 40) {
        score += 10;
    }

    const dialogue = Array.isArray(quest.dialogue) ? quest.dialogue : [];
    if (dialogue.length >= 3) {
        score += 20;
    } else if (dialogue.length > 0) {
        score += 10;
    }

    if (dialogue.length > 0) {
        const nodesWithOptions = dialogue.filter((node) => (node.options || []).length > 0);
        const optionCoverage = nodesWithOptions.length / dialogue.length;
        score += Math.round(optionCoverage * 20);

        const branching = dialogue.some((node) => (node.options || []).length >= 2);
        if (branching) {
            score += 10;
        }

        const hasProcessOption = dialogue.some((node) =>
            (node.options || []).some((option) => option.type === 'process' && option.process)
        );
        if (hasProcessOption) {
            score += 5;
        }

        const hasFinish = dialogue.some((node) =>
            (node.options || []).some(
                (option) => option.type === 'finish' || option.goto === 'finish'
            )
        );
        if (hasFinish) {
            score += 5;
        }
    }

    if (Array.isArray(quest.requiresQuests) && quest.requiresQuests.length > 0) {
        score += 5;
    }

    return clampScore(score);
};
