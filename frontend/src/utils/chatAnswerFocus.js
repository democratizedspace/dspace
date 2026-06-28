export const ANSWER_FOCUS_MAX_CHARS = 700;
export const ANSWER_FOCUS_LATEST_REQUEST_PREVIEW_MAX_CHARS = 200;

const ANSWER_FOCUS_TEXT = [
    'Answer the final user message directly.',
    'Use PlayerState, focused game data, and docs grounding only when relevant.',
    'Do not summarize unrelated inventory, quests, docs, or processes.',
    'Omitted compact-state details are not evidence that the player lacks them.',
    'If selected context is insufficient, ask a clarifying question instead of guessing.',
    'Give exact counts, costs, durations, requirements, or routes only when selected context states them.',
].join(' ');

export const buildAnswerFocusMessage = ({ latestUserMessage, contextPlan } = {}) => {
    if (contextPlan?.mode !== 'full') return null;
    if (!latestUserMessage || latestUserMessage.role !== 'user') return null;
    if (!String(latestUserMessage.content || '').trim()) return null;

    return {
        role: 'system',
        content: ANSWER_FOCUS_TEXT.slice(0, ANSWER_FOCUS_MAX_CHARS),
    };
};
