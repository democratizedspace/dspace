const HARDENING_EMOJIS = ['🛠️', '🌀', '✅', '💯'];

const defaultHardening = Object.freeze({
    passes: 0,
    score: 0,
    emoji: '🛠️',
    history: [],
});

const scoreBounds = { min: 0, max: 100 };

const hardeningThresholds = [
    { passes: 3, score: 90, emoji: '💯' },
    { passes: 2, score: 75, emoji: '✅' },
    { passes: 1, score: 60, emoji: '🌀' },
];

function clampScore(rawScore = 0) {
    const rounded = Math.round(Number.isFinite(rawScore) ? rawScore : 0);
    if (Number.isNaN(rounded)) return 0;
    return Math.min(scoreBounds.max, Math.max(scoreBounds.min, rounded));
}

function emojiForHardening(hardening) {
    for (const threshold of hardeningThresholds) {
        if (hardening.passes >= threshold.passes && hardening.score >= threshold.score) {
            return threshold.emoji;
        }
    }
    return '🛠️';
}

function validateHardening(hardening) {
    const errors = [];
    if (!hardening || typeof hardening !== 'object') {
        return ['hardening must be an object'];
    }

    if (!Number.isInteger(hardening.passes) || hardening.passes < 0) {
        errors.push('passes must be a non-negative integer');
    }

    if (!Number.isInteger(hardening.score) || hardening.score < 0 || hardening.score > 100) {
        errors.push('score must be an integer between 0 and 100');
    }

    if (!HARDENING_EMOJIS.includes(hardening.emoji)) {
        errors.push(`emoji must be one of ${HARDENING_EMOJIS.join(', ')}`);
    }

    if (!Array.isArray(hardening.history)) {
        errors.push('history must be an array');
    } else {
        hardening.history.forEach((entry, index) => {
            if (!entry || typeof entry !== 'object') {
                errors.push(`history[${index}] must be an object`);
                return;
            }
            if (!entry.task || typeof entry.task !== 'string') {
                errors.push(`history[${index}] task must be a string`);
            }
            if (!entry.date || typeof entry.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
                errors.push(`history[${index}] date must be YYYY-MM-DD`);
            }
            if (
                !Number.isInteger(entry.score) ||
                entry.score < scoreBounds.min ||
                entry.score > scoreBounds.max
            ) {
                errors.push(`history[${index}] score must be an integer between 0 and 100`);
            }
        });
    }

    if (Array.isArray(hardening.history) && hardening.passes !== hardening.history.length) {
        errors.push('passes must equal history length');
    }

    return errors;
}

function normalizeHardening(hardening, { minimumScore = 0 } = {}) {
    const incoming = hardening && typeof hardening === 'object' ? hardening : {};
    const history = Array.isArray(incoming.history)
        ? incoming.history.map((entry) => ({
              task: entry.task || '',
              date: entry.date || '',
              score: clampScore(entry.score ?? 0),
          }))
        : [];

    const normalizedScore = clampScore(
        Math.max(minimumScore, incoming.score ?? defaultHardening.score ?? 0)
    );

    const normalized = {
        ...defaultHardening,
        ...incoming,
        history,
        passes: history.length,
        score: normalizedScore,
    };

    normalized.emoji = emojiForHardening(normalized);

    return normalized;
}

function evaluateQuestQuality(quest) {
    let score = 0;
    const descriptionLength = quest?.description?.length ?? 0;
    if (descriptionLength >= 120) score += 20;
    else if (descriptionLength >= 60) score += 14;
    else if (descriptionLength > 0) score += 8;

    const dialogue = Array.isArray(quest?.dialogue) ? quest.dialogue : [];
    if (dialogue.length >= 4) score += 20;
    else if (dialogue.length >= 2) score += 12;
    else if (dialogue.length > 0) score += 6;

    const startNode = dialogue.find((node) => node.id === quest?.start);
    if (startNode) score += 10;

    const finishOptions = dialogue.reduce(
        (count, node) => count + (node.options || []).filter((opt) => opt.type === 'finish').length,
        0
    );
    if (finishOptions > 0) score += 10;

    const branchingNodes = dialogue.filter((node) => (node.options || []).length > 1).length;
    score += Math.min(15, branchingNodes * 5);

    const usesItems = dialogue.some((node) =>
        (node.options || []).some((opt) =>
            (Array.isArray(opt.requiresItems) && opt.requiresItems.length > 0) ||
            (Array.isArray(opt.grantsItems) && opt.grantsItems.length > 0)
        )
    );
    if (usesItems) score += 10;

    const usesProcesses = dialogue.some((node) => (node.options || []).some((opt) => opt.process));
    if (usesProcesses) score += 10;

    if (Array.isArray(quest?.rewards) && quest.rewards.length > 0) {
        score += 5;
    }

    if (Array.isArray(quest?.requiresQuests) && quest.requiresQuests.length > 0) {
        score += 5;
    }

    if (quest?.npc) {
        score += 5;
    }

    return clampScore(score);
}

function evaluateProcessQuality(process) {
    let score = 10;
    if (Array.isArray(process?.requireItems) && process.requireItems.length > 0) {
        score += 15;
    }
    if (Array.isArray(process?.consumeItems) && process.consumeItems.length > 0) {
        score += 15;
    }
    if (Array.isArray(process?.createItems) && process.createItems.length > 0) {
        score += 20;
    }
    if (process?.duration) {
        score += 10;
    }
    if (process?.image) {
        score += 5;
    }
    if (process?.title && process.title.length > 30) {
        score += 5;
    }
    if (
        Array.isArray(process?.requireItems) &&
        Array.isArray(process?.consumeItems) &&
        Array.isArray(process?.createItems) &&
        process.requireItems.length > 0 &&
        process.consumeItems.length > 0 &&
        process.createItems.length > 0
    ) {
        score += 5;
    }
    return clampScore(score);
}

function hardeningStatusText(hardening) {
    const emoji = emojiForHardening(hardening);
    switch (emoji) {
        case '💯':
            return 'Hardened';
        case '✅':
            return 'Ready';
        case '🌀':
            return 'Polishing';
        default:
            return 'Draft';
    }
}

module.exports = {
    HARDENING_EMOJIS,
    defaultHardening,
    clampScore,
    emojiForHardening,
    validateHardening,
    normalizeHardening,
    evaluateQuestQuality,
    evaluateProcessQuality,
    hardeningStatusText,
};
