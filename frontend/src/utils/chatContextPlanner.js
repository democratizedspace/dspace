import items from '../pages/inventory/json/items';
import processes from '../generated/processes.json';
import quests from '../generated/quests/listManifest.json';

const fullPlan = (reasonCodes, docsRagReasonCodes = []) => {
    const uniqueDocsReasonCodes = [...new Set(docsRagReasonCodes)];

    return {
        mode: 'full',
        includePlayerState: true,
        includeKnowledgePack: true,
        includeDocsRag: uniqueDocsReasonCodes.some(
            (reasonCode) => reasonCode !== 'docs-rag-not-needed'
        ),
        includePersonaVoiceSamples: false,
        reasonCodes: [...new Set(reasonCodes)],
        docsRagReasonCodes: uniqueDocsReasonCodes.length
            ? uniqueDocsReasonCodes
            : ['docs-rag-not-needed'],
        confidence: 'conservative',
    };
};

const minimalPlan = () => ({
    mode: 'minimal',
    includePlayerState: false,
    includeKnowledgePack: false,
    includeDocsRag: false,
    includePersonaVoiceSamples: true,
    reasonCodes: ['no-grounding-signals'],
    confidence: 'high',
});

const stringifyContent = (content) => {
    if (typeof content === 'string') return content;
    if (content === null || content === undefined) return '';
    if (Array.isArray(content)) {
        return content
            .map((entry) => {
                if (typeof entry === 'string') return entry;
                if (entry && typeof entry === 'object') {
                    return stringifyContent(entry.text ?? entry.content ?? entry.value ?? '');
                }
                return stringifyContent(entry);
            })
            .filter(Boolean)
            .join(' ');
    }
    if (typeof content === 'object') {
        return stringifyContent(content.text ?? content.content ?? content.value ?? '');
    }
    return String(content);
};

export const latestUserContent = (messages) =>
    [...(Array.isArray(messages) ? messages : [])]
        .reverse()
        .map((message) => (message?.role === 'user' ? stringifyContent(message.content) : ''))
        .find((content) => content.trim()) || '';

const regexHits = (text, checks) =>
    checks.filter(({ pattern }) => pattern.test(text)).map(({ reasonCode }) => reasonCode);

const groundingChecks = [
    {
        reasonCode: 'player-state-progress',
        pattern:
            /\b(status|progress(?:ing)?|guardrails?|inventory|do i have|can i afford|enough|missing|remaining|left|what next|what should i do|what should i build|unlock(?:s|ed)?|rewards?|completed quests?|active process(?:es)?|running process(?:es)?|balances?|resources?)\b/i,
    },
    {
        reasonCode: 'game-data',
        pattern:
            /\b(token\.place|quests?|achievements?|rewards?|requirements?|gates?|unlocks?|balances?)\b/i,
    },
    {
        reasonCode: 'process-data',
        pattern:
            /\bprocess(?:es)?\b(?=.*\b(consumes?|creates?|duration|requires?|requirements?|quest|inventory|dspace|custom|crafting|materials)\b)|\b(consumes?|duration)\b/i,
    },
    {
        reasonCode: 'item-data',
        pattern:
            /\bitems?\b(?=.*\b(inventory|quest|dspace|custom|requirements?|rewards?|gates?)\b)/i,
    },
    {
        reasonCode: 'custom-content',
        pattern:
            /\b(custom content|custom quests?|custom items?|custom processes?|quest submission|content bundles?|custom content bundles?|content backup|add custom content to dspace)\b/i,
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

const docsRagIntentChecks = [
    {
        reasonCode: 'route-docs',
        pattern:
            /(?:\/docs|\/quests|\/inventory|\/processes|\/settings|\/gamesaves|\broutes?\b|\bpages?\b)/i,
    },
    {
        reasonCode: 'docs-navigation',
        pattern:
            /\b(?:docs?|documentation|where do i|how do i get to|settings|gamesaves?|import(?: a)? save|export(?: a)? save|back up|backup|content backup)\b/i,
    },
    {
        reasonCode: 'custom-content-docs',
        pattern:
            /\b(?:custom content|custom quests?|custom items?|custom processes?|quest submission|submit a custom quest|content bundles?|content editor|add custom content to dspace)\b/i,
    },
    {
        reasonCode: 'changelog-version-docs',
        pattern:
            /\b(?:changelog|release notes?|token\.place integration|v\d+(?:\.\d+)?|drift|deprecated|current release state)\b|\bversion\b(?=.*\b(?:changelog|release|docs?|integration)\b)/i,
    },
    {
        reasonCode: 'changelog-version-docs',
        pattern: /\btoken\.place\b(?=.*\b(?:active|current|release|version|docs?|integration)\b)/i,
    },
    {
        reasonCode: 'mechanics-docs',
        pattern:
            /\bprocess(?:es)?\b(?=.*\b(?:consumes?|creates?|requires?|requirements?|duration)\b)|\b(?:consumes?|creates?|requires?|duration)\b(?=.*\bprocess(?:es)?\b)|\brequires?\b(?=.*\bconsumes?\b)(?=.*\bcreates?\b)(?=.*\bduration\b)/i,
    },
    {
        reasonCode: 'mechanics-docs',
        pattern:
            /\bquest(?:s)?\b(?=.*\b(?:requirements?|rewards?|gates?|dialogue options?|schema|authoring|how-to)\b)|\b(?:requirements?|rewards?|gates?|dialogue options?)\b(?=.*\b(?:quest|give|grant|preflight check)\b)/i,
    },
    {
        reasonCode: 'mechanics-docs',
        pattern: /\b(?:schema|authoring|how-to authoring)\b/i,
    },
];

export const detectDocsRagIntent = (text) => {
    const reasonCodes = regexHits(text, docsRagIntentChecks);
    return reasonCodes.length ? [...new Set(reasonCodes)] : ['docs-rag-not-needed'];
};

const resourcePattern = /\bd(?:USD|BI|Watt|Solar|Print|Launch|Fuel|Oxygen|Water|Food)\b/i;

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

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const strongEntityMatchers = strongEntityTerms.map((term) =>
    term.includes('/')
        ? (text) => text.includes(term)
        : new RegExp(`(^|\\s)${escapeRegExp(term)}(\\s|$)`)
);

export const hasStrongEntityHit = (text) => {
    const normalizedText = normalize(text);
    if (!normalizedText) return false;
    return strongEntityMatchers.some((matcher) =>
        typeof matcher === 'function' ? matcher(normalizedText) : matcher.test(normalizedText)
    );
};

export const hasGroundingSignal = (text, docsRagReasonCodes = detectDocsRagIntent(text)) => {
    const reasonCodes = regexHits(text, groundingChecks);
    if (resourcePattern.test(text)) reasonCodes.push('resource-token');
    if (!docsRagReasonCodes.includes('docs-rag-not-needed')) {
        reasonCodes.push('docs-rag-intent');
    }
    if (hasStrongEntityHit(text)) reasonCodes.push('entity-hit');
    return reasonCodes;
};

export const planChatContext = (messages, options = {}) => {
    if (options.contextPlan) return options.contextPlan;
    const latest = latestUserContent(messages);
    if (!latest.trim()) return fullPlan(['no-latest-user-message']);

    const docsRagReasonCodes = detectDocsRagIntent(latest);
    const reasonCodes = hasGroundingSignal(latest, docsRagReasonCodes);

    return reasonCodes.length ? fullPlan(reasonCodes, docsRagReasonCodes) : minimalPlan();
};
