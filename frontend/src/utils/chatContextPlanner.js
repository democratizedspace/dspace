const latestUserContent = (messages) =>
    [...(Array.isArray(messages) ? messages : [])]
        .reverse()
        .find((message) => message?.role === 'user' && String(message?.content || '').trim())
        ?.content || '';

const hasPattern = (patterns, text) => patterns.some((pattern) => pattern.test(text));

const playerStatePatterns = [
    /\b(inventory|do i have|can i afford|afford|enough|missing|remaining|left|what next|what should i do|what should i build|build next|unlock(?:s|ed)?|rewards?|completed quests?|active processes?|running processes?|balances?|resources?|status)\b/i,
    /\b(how many|how much)\b.*\b(i have|left|remaining|need|missing)\b/i,
];

const gameDataPatterns = [
    /\b(quests?|items?|process(?:es)?|achievements?|rewards?|requirements?|requires|consumes?|creates?|duration|recipes?|gates?|prereqs?|preflight check)\b/i,
];

const docsNavigationPatterns = [
    /\b(docs?|routes?|pages?|settings|gamesaves?|import|export|where do i|how do i get to|navigate|navigation)\b/i,
    /\/(docs|quests|inventory|process(?:es)?|settings|gamesaves|stats|leaderboard|titles|toolbox)\b/i,
];

const vagueFollowupPatterns = [
    /\b(what about that|what about the second option|tell me more|continue|next step|that one|the other one|second option)\b/i,
    /^\s*(what about|and then|that step|the second step|step 2)\b/i,
];

const entityPatterns = [
    /\b(?:dUSD|dBI|dWatt|dSolar|dPrint|dLaunch)\b/,
    /\b(?:Benchy|green PLA|solar tracker|phone stand|bed leveling|preflight check|hydroponics tub|stevia|token\.place)\b/i,
    /\b(?:welcome\/howtodoquests|3dprinting\/|hydroponics\/|rocketry\/)\S*/i,
];

const fullPlan = (reasonCodes) => ({
    mode: 'full',
    includePlayerState: true,
    includeKnowledgePack: true,
    includeDocsRag: true,
    includePersonaVoiceSamples: false,
    reasonCodes,
    confidence: 'conservative',
});

export const planChatContext = (messages, options = {}) => {
    if (options.contextPlan) return options.contextPlan;
    const text = latestUserContent(messages);
    const reasonCodes = [];

    if (!text.trim()) {
        reasonCodes.push('no-latest-user-message');
        return fullPlan(reasonCodes);
    }
    if (hasPattern(playerStatePatterns, text)) reasonCodes.push('player-state-or-progress');
    if (hasPattern(gameDataPatterns, text)) reasonCodes.push('game-data');
    if (hasPattern(docsNavigationPatterns, text)) reasonCodes.push('docs-or-navigation');
    if (hasPattern(vagueFollowupPatterns, text)) reasonCodes.push('vague-followup');
    if (hasPattern(entityPatterns, text)) reasonCodes.push('dspace-entity');

    if (reasonCodes.length) return fullPlan(reasonCodes);

    return {
        mode: 'minimal',
        includePlayerState: false,
        includeKnowledgePack: false,
        includeDocsRag: false,
        includePersonaVoiceSamples: true,
        reasonCodes: ['no-grounding-signals'],
        confidence: 'high',
    };
};
