import items from '../pages/inventory/json/items/index.js';
import processes from '../generated/processes.json' assert { type: 'json' };
import questManifest from '../generated/quests/listManifest.json' assert { type: 'json' };

const fullPlan = (reasonCodes, confidence = 'conservative') => ({
    mode: 'full',
    includePlayerState: true,
    includeKnowledgePack: true,
    includeDocsRag: true,
    includePersonaVoiceSamples: false,
    reasonCodes: [...new Set(reasonCodes)],
    confidence,
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

const normalize = (text) => String(text || '').toLowerCase();
const has = (text, pattern) => pattern.test(text);

const resourcePattern =
    /\b(dusd|dbi|dwatt|dsolar|dprint|dlaunch|dwater|dchem|dwood|doxygen|dstevia)\b/i;
const statePattern =
    /\b(inventory|do i have|can i afford|afford|enough|missing|remaining|left|what next|what should i do|what should i .* next|unlock|unlocks|reward|rewards|completed quest|active process|running process|balance|balances|resources?|status)\b/i;
const gameDataPattern =
    /\b(quests?|items?|process(?:es)?|achievements?|requirements?|requires|consume|consumes|creates?|duration|recipes?|gates?|preflight check|changelog|release notes?|version|guardrails?)\b/i;
const navigationPattern =
    /(?:token\.place|\/docs|\/quests|\/inventory|\/processes|\/settings|\/gamesaves|\bdocs?\b|\broutes?\b|\bpages?\b|\bsettings\b|\bgamesaves?\b|\bimport\b|\bexport\b|\bwhere do i\b|\bhow do i get to\b)/i;
const followUpPattern =
    /\b(what about that|what about the second option|what about the second step|tell me more|continue|next step|that one|the other one)\b/i;

const importantEntityPattern = /\b(benchy|green pla|solar tracker|preflight check)\b/i;

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const compactEntityValues = [
    ...items.flatMap((item) => [item.id, item.name, item.title]).filter(Boolean),
    ...processes.flatMap((process) => [process.id, process.title]).filter(Boolean),
    ...questManifest.flatMap((quest) => [quest.id, quest.title, quest.route]).filter(Boolean),
]
    .filter((value) => typeof value === 'string' && value.length >= 4)
    .sort((a, b) => b.length - a.length)
    .slice(0, 1500);

export const hasKnownDspaceEntityHit = (message) => {
    const text = normalize(message);
    if (has(text, importantEntityPattern) || has(text, resourcePattern)) return true;
    return compactEntityValues.some((entity) => {
        const normalizedEntity = normalize(entity).trim();
        if (!normalizedEntity) return false;
        if (normalizedEntity.includes('/')) return text.includes(normalizedEntity);
        return new RegExp(`\\b${escapeRegExp(normalizedEntity)}\\b`, 'i').test(text);
    });
};

export const planChatContext = (messages, _options = {}) => {
    const latest = latestUserContent(messages);
    const reasonCodes = [];

    if (!latest.trim()) return fullPlan(['no-latest-user-message']);
    if (latest.length > 2000) return fullPlan(['long-user-message']);
    if (has(latest, statePattern)) reasonCodes.push('player-state-or-progress');
    if (has(latest, gameDataPattern)) reasonCodes.push('game-data');
    if (has(latest, navigationPattern)) reasonCodes.push('docs-or-navigation');
    if (has(latest, followUpPattern)) reasonCodes.push('vague-follow-up');
    if (hasKnownDspaceEntityHit(latest)) reasonCodes.push('known-dspace-entity');

    return reasonCodes.length > 0 ? fullPlan(reasonCodes) : minimalPlan();
};
