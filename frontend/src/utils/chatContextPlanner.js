const fullPlan = (reasonCodes) => ({
    mode: 'full',
    includePlayerState: true,
    includeKnowledgePack: true,
    includeDocsRag: true,
    includePersonaVoiceSamples: false,
    reasonCodes: [...new Set(reasonCodes)],
    confidence: 'conservative',
});

const minimalPlan = () => ({
    mode: 'minimal',
    includePlayerState: false,
    includeKnowledgePack: false,
    includeDocsRag: false,
    includePersonaVoiceSamples: true,
    reasonCodes: ['no-grounding-signals'],
    confidence: 'high',
});

const latestUserContent = (messages) =>
    [...(Array.isArray(messages) ? messages : [])]
        .reverse()
        .find((message) => message?.role === 'user' && `${message.content || ''}`.trim())
        ?.content || '';

const longMessageGroundingThreshold = 2000;

const patterns = [
    [
        'player-state-progress',
        /\b(inventory|do i have|can i afford|enough|missing|remaining|left|what next|what should i (?:do|build|make|print|craft).*next|what should i do|unlock|unlocks|reward|rewards|completed quests?|active processes?|running processes?|balances?|resources?|status)\b/i,
    ],
    [
        'game-data',
        /\b(quests?|items?|process(?:es)?|achievements?|requirements?|requires?|consumes?|creates?|duration|recipes?|gates?|preflight check|green pla|solar tracker)\b/i,
    ],
    [
        'docs-navigation',
        /(?:\/docs|\/quests|\/inventory|\/processes|\/settings|\/gamesaves)|\b(docs?|routes?|pages?|settings|gamesaves?|changelog|release notes|import|export|where do i|how do i get to)\b/i,
    ],
    [
        'vague-followup',
        /\b(what about (?:that|the|this)|what about the second option|tell me more|continue|next step|that one|the other one|second option)\b/i,
    ],
    [
        'dspace-entity',
        /\b(token\.place|benchy|dusd|dbi|dwatt|dsolar|dprint|dlaunch|phone stand|bed leveling|print bed|hydroponics tub|stevia)\b/i,
    ],
];

export const getChatGroundingReasonCodes = (content) => {
    const text = `${content || ''}`.trim();
    if (!text) {
        return ['empty-latest-user-message'];
    }
    const reasonCodes = patterns
        .filter(([, pattern]) => pattern.test(text))
        .map(([reason]) => reason);
    if (text.length > longMessageGroundingThreshold) {
        reasonCodes.push('long-message-uncertain');
    }
    return reasonCodes;
};

export const planChatContext = (messages, options = {}) => {
    if (options.contextPlan) {
        return options.contextPlan;
    }
    const content = latestUserContent(messages);
    const reasonCodes = getChatGroundingReasonCodes(content);
    return reasonCodes.length > 0 ? fullPlan(reasonCodes) : minimalPlan();
};
