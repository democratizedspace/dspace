const ALLOWED_HARDENING_EMOJI = ['🛠️', '🌀', '✅', '💯'];
const DEFAULT_HARDENING = Object.freeze({ passes: 0, score: 0, emoji: '🛠️', history: [] });
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function clampScore(score) {
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function statusEmoji(passes, score) {
  if (passes >= 3 && score >= 90) return '💯';
  if (passes >= 2 && score >= 75) return '✅';
  if (passes >= 1 && score >= 60) return '🌀';
  return '🛠️';
}

function evaluateQuestQuality(quest) {
  let score = 0;
  const dialogueCount = Array.isArray(quest.dialogue) ? quest.dialogue.length : 0;
  const optionsCount = Array.isArray(quest.dialogue)
    ? quest.dialogue.reduce((sum, node) => sum + (node.options?.length || 0), 0)
    : 0;
  const branching = Array.isArray(quest.dialogue)
    ? quest.dialogue.some((node) => (node.options?.length || 0) > 1)
    : false;
  const finishOptions = Array.isArray(quest.dialogue)
    ? quest.dialogue.some((node) => (node.options || []).some((opt) => opt.type === 'finish'))
    : false;
  const usesItems = Array.isArray(quest.dialogue)
    ? quest.dialogue.some((node) =>
        (node.options || []).some((opt) =>
          (opt.requiresItems && opt.requiresItems.length > 0) ||
          (opt.grantsItems && opt.grantsItems.length > 0)
        )
      )
    : false;
  const usesProcesses = Array.isArray(quest.dialogue)
    ? quest.dialogue.some((node) => (node.options || []).some((opt) => !!opt.process))
    : false;

  if (quest.description?.length >= 80) score += 10;
  else if (quest.description?.length >= 20) score += 6;

  if (dialogueCount > 0) score += Math.min(30, dialogueCount * 6);
  if (optionsCount > 0) score += Math.min(10, optionsCount * 2);
  if (branching) score += 10;
  if (finishOptions) score += 5;
  if (usesItems) score += 10;
  if (usesProcesses) score += 10;
  if (Array.isArray(quest.rewards) && quest.rewards.length > 0) score += 5;
  if (Array.isArray(quest.requiresQuests) && quest.requiresQuests.length > 0) score += 4;
  if (quest.image) score += 5;

  return clampScore(score);
}

function evaluateProcessQuality(process) {
  let score = 0;
  const durationSeconds = parseDuration(process.duration);

  if (typeof process.title === 'string' && process.title.trim().length >= 6) {
    score += 12;
    if (process.title.trim().length >= 18) score += 3;
  }
  if (durationSeconds > 0) {
    score += 12;
    if (durationSeconds >= 300) score += 5;
    if (durationSeconds >= 3600) score += 5;
  }

  const itemLists = ['requireItems', 'consumeItems', 'createItems'];
  let itemConnections = 0;
  itemLists.forEach((key) => {
    const entries = process[key] || [];
    if (entries.length > 0) {
      itemConnections += 1;
      score += Math.min(10, entries.length * 3);
    }
  });
  if (itemConnections >= 2) score += 8;

  if (process.image) score += 3;

  return clampScore(score);
}

function parseDuration(durationString) {
  if (typeof durationString !== 'string') return 0;
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
}

function sanitizeHistory(history = []) {
  if (!Array.isArray(history)) return [];
  return history.map((entry) => ({
    task: typeof entry?.task === 'string' ? entry.task : '',
    date: typeof entry?.date === 'string' && DATE_PATTERN.test(entry.date) ? entry.date : '1970-01-01',
    score: clampScore(entry?.score ?? 0)
  }));
}

function validateHardening(hardening) {
  const errors = [];
  if (!hardening || typeof hardening !== 'object') {
    return { valid: false, errors: ['hardening missing'] };
  }
  if (!Number.isInteger(hardening.passes) || hardening.passes < 0) {
    errors.push('passes must be a non-negative integer');
  }
  if (!Number.isInteger(hardening.score) || hardening.score < 0 || hardening.score > 100) {
    errors.push('score must be an integer between 0 and 100');
  }
  if (!ALLOWED_HARDENING_EMOJI.includes(hardening.emoji)) {
    errors.push(`emoji must be one of ${ALLOWED_HARDENING_EMOJI.join(', ')}`);
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
        errors.push(`history[${index}].task must be a string`);
      }
      if (!entry.date || !DATE_PATTERN.test(entry.date)) {
        errors.push(`history[${index}].date must be YYYY-MM-DD`);
      }
      if (!Number.isInteger(entry.score) || entry.score < 0 || entry.score > 100) {
        errors.push(`history[${index}].score must be an integer between 0 and 100`);
      }
    });
    if (hardening.passes !== hardening.history.length) {
      errors.push('passes must equal history length');
    }
  }
  return { valid: errors.length === 0, errors };
}

function normalizeHardening(hardening, { scoreFloor = 0 } = {}) {
  const safe = { ...DEFAULT_HARDENING, ...(hardening || {}) };
  const normalizedHistory = sanitizeHistory(safe.history);
  const normalizedScore = clampScore(Math.max(scoreFloor, safe.score ?? 0));
  const passes = normalizedHistory.length;
  return {
    passes,
    score: normalizedScore,
    emoji: statusEmoji(passes, normalizedScore),
    history: normalizedHistory
  };
}

module.exports = {
  ALLOWED_HARDENING_EMOJI,
  DATE_PATTERN,
  DEFAULT_HARDENING,
  evaluateProcessQuality,
  evaluateQuestQuality,
  normalizeHardening,
  parseDuration,
  statusEmoji,
  validateHardening
};
