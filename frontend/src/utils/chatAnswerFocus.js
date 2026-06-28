export const ANSWER_FOCUS_MAX_CHARS = 700;
export const ANSWER_FOCUS_PREVIEW_MAX_CHARS = 0;

const ANSWER_FOCUS_TEXT = [
    'Answer the final user message directly in the selected persona voice.',
    'Use PlayerState, focused game data, and docs grounding only when relevant.',
    'Do not summarize unrelated inventory, quests, docs, or processes.',
    'Omitted compact-state details are not evidence that the player lacks them.',
    'If selected context is insufficient, ask a clarifying question instead of guessing.',
    'Give exact counts, costs, durations, requirements, or routes only when selected context says so.',
].join('\n');

const truncateFocusText = (text, maxChars = ANSWER_FOCUS_MAX_CHARS) => {
    const normalizedMax = Number.isFinite(Number(maxChars))
        ? Math.max(0, Number(maxChars))
        : ANSWER_FOCUS_MAX_CHARS;
    if (text.length <= normalizedMax) return text;
    return text.slice(0, normalizedMax).trimEnd();
};

export const buildAnswerFocusMessage = ({ contextPlan, options = {} } = {}) => {
    if (contextPlan?.mode !== 'full') return null;
    if (options.includeAnswerFocus === false) return null;

    const content = truncateFocusText(
        ANSWER_FOCUS_TEXT,
        options.answerFocusMaxChars || ANSWER_FOCUS_MAX_CHARS
    );
    if (!content.trim()) return null;

    return {
        role: 'system',
        content,
    };
};
