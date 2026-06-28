const textEncoder = new TextEncoder();

const summarizeText = (value) => {
    const text = String(value ?? '');
    return {
        characters: text.length,
        utf8Bytes: textEncoder.encode(text).length,
    };
};

const emptyComponentTotals = () => ({
    systemInstructions: { characters: 0, utf8Bytes: 0 },
    rag: { characters: 0, utf8Bytes: 0 },
    playerState: { characters: 0, utf8Bytes: 0 },
    chatHistory: { characters: 0, utf8Bytes: 0 },
    latestUserMessage: { characters: 0, utf8Bytes: 0 },
});

const addSize = (target, size) => {
    target.characters += size.characters;
    target.utf8Bytes += size.utf8Bytes;
};

const normalizeIndexes = (value) => {
    if (Array.isArray(value)) return value;
    if (Number.isInteger(value)) return [value];
    return [];
};

const numberOrZero = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const stringList = (value, max = 12) =>
    Array.isArray(value) ? value.slice(0, max).map((entry) => String(entry)) : [];

const sanitizeAnswerFocus = (value) => ({
    included: Boolean(value?.included),
    characterCount: numberOrZero(value?.characterCount),
    placementIndex: Number.isInteger(value?.placementIndex) ? value.placementIndex : -1,
    latestUserMessageIndex: Number.isInteger(value?.latestUserMessageIndex)
        ? value.latestUserMessageIndex
        : -1,
});

const sanitizeFocusedGameData = (focused) => {
    if (!focused || typeof focused !== 'object') return null;
    return {
        included: Boolean(focused.included),
        reasonCodes: stringList(focused.reasonCodes),
        selectedItemCount: numberOrZero(focused.selectedItemCount),
        selectedQuestCount: numberOrZero(focused.selectedQuestCount),
        selectedProcessCount: numberOrZero(focused.selectedProcessCount),
        selectedAchievementCount: numberOrZero(focused.selectedAchievementCount),
        selectedInventoryCount: numberOrZero(focused.selectedInventoryCount),
        selectedItemIds: stringList(focused.selectedItemIds),
        selectedQuestIds: stringList(focused.selectedQuestIds),
        selectedProcessIds: stringList(focused.selectedProcessIds),
        selectedAchievementIds: stringList(focused.selectedAchievementIds),
        selectedInventoryIds: stringList(focused.selectedInventoryIds),
        renderedChars: numberOrZero(focused.renderedChars),
        caps: focused.caps
            ? {
                  maxItems: numberOrZero(focused.caps.maxItems),
                  maxQuests: numberOrZero(focused.caps.maxQuests),
                  maxProcesses: numberOrZero(focused.caps.maxProcesses),
                  maxAchievements: numberOrZero(focused.caps.maxAchievements),
                  maxTotalChars: numberOrZero(focused.caps.maxTotalChars),
                  maxEntityChars: numberOrZero(focused.caps.maxEntityChars),
                  maxSources: numberOrZero(focused.caps.maxSources),
              }
            : null,
        truncated: Boolean(focused.truncated),
    };
};

const sanitizePlayerStateSummary = (summary) => {
    if (!summary || typeof summary !== 'object') return null;

    const safeSummary = {
        playerStatePromptMode:
            typeof summary.playerStatePromptMode === 'string'
                ? summary.playerStatePromptMode
                : 'unknown',
        completedQuestCount: numberOrZero(summary.completedQuestCount),
        totalOfficialQuestCount: numberOrZero(summary.totalOfficialQuestCount),
        remainingOfficialQuestCount: numberOrZero(summary.remainingOfficialQuestCount),
        remainingQuestIncludedCount: numberOrZero(summary.remainingQuestIncludedCount),
        inventoryTotalCount: numberOrZero(summary.inventoryTotalCount),
        inventoryIncludedCount: numberOrZero(summary.inventoryIncludedCount),
        inventoryTruncated: Boolean(summary.inventoryTruncated),
        activeProcessIncludedCount: numberOrZero(summary.activeProcessIncludedCount),
        blockCharCount: numberOrZero(summary.blockCharCount),
    };

    if (Number.isFinite(summary.questsFinishedCount)) {
        safeSummary.questsFinishedCount = Number(summary.questsFinishedCount);
    }

    return safeSummary;
};

export const buildPromptMetrics = (promptPayload, metadata = {}) => {
    const messages = Array.isArray(promptPayload?.combinedMessages)
        ? promptPayload.combinedMessages
        : Array.isArray(promptPayload?.messages)
          ? promptPayload.messages
          : [];
    const roleCounts = {};
    const perMessage = messages.map((message, index) => {
        const role = typeof message?.role === 'string' ? message.role : 'unknown';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
        const size = summarizeText(message?.content);
        return { index, role, ...size };
    });
    const totalCharacters = perMessage.reduce((sum, message) => sum + message.characters, 0);
    const totalUtf8Bytes = perMessage.reduce((sum, message) => sum + message.utf8Bytes, 0);
    const componentTotals = emptyComponentTotals();

    for (const [name, value] of Object.entries(metadata.componentMessageIndexes || {})) {
        if (!Object.prototype.hasOwnProperty.call(componentTotals, name)) continue;
        for (const index of normalizeIndexes(value)) {
            const messageSummary = perMessage[index];
            if (messageSummary) addSize(componentTotals[name], messageSummary);
        }
    }

    for (const [name, value] of Object.entries(metadata.components || {})) {
        if (!Object.prototype.hasOwnProperty.call(componentTotals, name)) continue;
        if (Array.isArray(value)) {
            for (const entry of value) addSize(componentTotals[name], summarizeText(entry));
        } else {
            addSize(componentTotals[name], summarizeText(value));
        }
    }

    return {
        messageCount: messages.length,
        roleCounts,
        totalCharacters,
        totalUtf8Bytes,
        perMessage,
        componentTotals,
        promptBuildDurationMs: Number(metadata.promptBuildDurationMs || 0),
        ragDurationMs:
            metadata.ragDurationMs === undefined || metadata.ragDurationMs === null
                ? null
                : Number(metadata.ragDurationMs),
        focusedGameData: sanitizeFocusedGameData(metadata.contextPlan?.focusedGameData),
        answerFocus: sanitizeAnswerFocus(metadata.answerFocus),
        docsRag: metadata.contextPlan
            ? (() => {
                  const status =
                      metadata.contextPlan.docsRagStatus ||
                      (metadata.contextPlan.mode === 'minimal' ? 'not-applicable' : 'skipped');
                  return {
                      includeDocsRag:
                          status === 'included' ||
                          (status !== 'skipped' && Boolean(metadata.contextPlan.includeDocsRag)),
                      status,
                      reasonCodes: Array.isArray(metadata.contextPlan.docsRagReasonCodes)
                          ? metadata.contextPlan.docsRagReasonCodes
                          : [],
                      resultCount: Number(metadata.contextPlan.docsRagResultCount || 0),
                      renderedChars: Number(metadata.contextPlan.docsRagRenderedChars || 0),
                      budget: metadata.contextPlan.docsRagBudget
                          ? {
                                maxResults: metadata.contextPlan.docsRagBudget.maxResults,
                                maxChars: metadata.contextPlan.docsRagBudget.maxChars,
                                maxExcerptChars: metadata.contextPlan.docsRagBudget.maxExcerptChars,
                                routeMaxExcerptChars:
                                    metadata.contextPlan.docsRagBudget.routeMaxExcerptChars,
                            }
                          : null,
                      durationMs: status === 'included' ? Number(metadata.ragDurationMs || 0) : 0,
                  };
              })()
            : null,
        contextPlan: metadata.contextPlan || null,
        playerStateSummary: sanitizePlayerStateSummary(metadata.playerStateSummary),
    };
};
