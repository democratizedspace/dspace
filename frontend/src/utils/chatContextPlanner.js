import items from '../pages/inventory/json/items';
import processes from '../generated/processes.json';
import quests from '../generated/quests/listManifest.json';

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
        .find((message) => message?.role === 'user' && String(message.content || '').trim())
        ?.content || '';

const regexHits = (text, checks) =>
    checks.filter(({ pattern }) => pattern.test(text)).map(({ reasonCode }) => reasonCode);

const groundingChecks = [
    {
        reasonCode: 'player-state-progress',
        pattern:
            /\b(status|guardrails?|inventory|do i have|can i afford|enough|missing|remaining|left|what next|what should i do|what should i build|unlock(?:s|ed)?|rewards?|completed quests?|active process(?:es)?|running process(?:es)?|balances?|resources?)\b/i,
    },
    {
        reasonCode: 'game-data',
        pattern:
            /\b(token\.place|quests?|items?|process(?:es)?|achievements?|rewards?|requirements?|requires?|consumes?|creates?|duration|recipes?|gates?)\b/i,
    },
    {
        reasonCode: 'docs-navigation',
        pattern:
            /(?:\/docs|\/quests|\/inventory|\/processes|\/settings|\/gamesaves|\bdocs?\b|\broutes?\b|\bpages?\b|\bsettings\b|\bgamesaves?\b|\bimport\b|\bexport\b|\bwhere do i\b|\bhow do i get to\b)/i,
    },
    {
        reasonCode: 'vague-followup',
        pattern:
            /\b(what about (?:that|the|this)|what about the second option|tell me more|continue|next step|that one|the other one)\b/i,
    },
];

const resourcePattern = /\bd(?:USD|BI|Watt|Solar|Print|Launch|Fuel|Oxygen|Water|Food)\b/;

const normalize = (value) =>
    String(value || '')
        .toLowerCase()
        .replace(/[^a-z0-9/ -]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const strongEntityTerms = (() => {
    const terms = new Set(['benchy', 'green pla', 'solar tracker']);
    for (const item of items || []) {
        for (const value of [item?.id, item?.name]) {
            const normalized = normalize(value);
            if (normalized && (normalized.length >= 5 || /^[0-9a-f-]{8,}$/i.test(String(value)))) {
                terms.add(normalized);
            }
        }
    }
    for (const quest of quests || []) {
        for (const value of [quest?.id, quest?.title, quest?.slug]) {
            const normalized = normalize(value);
            if (normalized && normalized.length >= 5) terms.add(normalized);
        }
    }
    for (const process of processes || []) {
        for (const value of [process?.id, process?.title]) {
            const normalized = normalize(value);
            if (normalized && normalized.length >= 5) terms.add(normalized);
        }
    }
    return [...terms].sort((a, b) => b.length - a.length);
})();

const hasStrongEntityHit = (text) => {
    const normalizedText = normalize(text);
    if (!normalizedText) return false;
    return strongEntityTerms.some((term) => {
        if (term.includes('/')) return normalizedText.includes(term);
        return new RegExp(`(^|\\s)${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`).test(
            normalizedText
        );
    });
};

export const planChatContext = (messages, options = {}) => {
    if (options.contextPlan) return options.contextPlan;
    const latest = latestUserContent(messages);
    if (!latest.trim()) return fullPlan(['no-latest-user-message']);

    const reasonCodes = regexHits(latest, groundingChecks);
    if (resourcePattern.test(latest)) reasonCodes.push('resource-token');
    if (hasStrongEntityHit(latest)) reasonCodes.push('entity-hit');

    return reasonCodes.length ? fullPlan(reasonCodes) : minimalPlan();
};
