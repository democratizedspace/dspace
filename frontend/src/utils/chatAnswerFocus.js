export const ANSWER_FOCUS_MAX_CHARS = 700;
export const ANSWER_FOCUS_LATEST_PREVIEW_MAX_CHARS = 0;

const ANSWER_FOCUS_CONTENT = [
    'Answer the final user message directly.',
    'Use PlayerState, focused game data, and docs grounding only when relevant.',
    'Do not summarize or enumerate unrelated inventory, quests, docs, or processes.',
    'Omitted compact-state details are not evidence that the player lacks them.',
    'If selected context is insufficient, ask a clarifying question instead of guessing.',
    'Give exact counts, costs, durations, requirements, or routes only when selected context includes them.',
].join('\n');

export const buildAnswerFocusMessage = ({ latestUserMessage, contextPlan } = {}) => {
    if (contextPlan?.mode !== 'full') return null;
    if (!latestUserMessage || typeof latestUserMessage.content !== 'string') return null;

    const content = ANSWER_FOCUS_CONTENT.slice(0, ANSWER_FOCUS_MAX_CHARS);
    return {
        role: 'system',
        content,
    };
};
