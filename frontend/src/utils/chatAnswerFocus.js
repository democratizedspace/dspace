export const ANSWER_FOCUS_MAX_CHARS = 700;
export const ANSWER_FOCUS_LATEST_REQUEST_PREVIEW_MAX_CHARS = 0;

const ANSWER_FOCUS_TEXT = [
    'Answer the final user message directly.',
    'Use PlayerState, focused game data, and docs grounding only when relevant.',
    'Do not summarize or enumerate unrelated inventory, quests, docs, or processes.',
    'Omitted compact-state details are not evidence that the player lacks them.',
    'If selected context is insufficient, ask a clarifying question instead of guessing.',
    'Give exact counts, costs, durations, requirements, or routes only when they appear in selected context.',
].join(' ');

const truncateAnswerFocus = (text) => {
    if (text.length <= ANSWER_FOCUS_MAX_CHARS) return text;
    return text.slice(0, ANSWER_FOCUS_MAX_CHARS).trimEnd();
};

export const buildAnswerFocusMessage = ({ contextPlan } = {}) => {
    if (contextPlan?.mode !== 'full') return null;

    return {
        role: 'system',
        content: truncateAnswerFocus(`Answer focus: ${ANSWER_FOCUS_TEXT}`),
    };
};
