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

const numberOrZero = (value) => (Number.isFinite(value) ? Number(value) : 0);

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

const sanitizeFocusedGameData = (meta) => {
    if (!meta || typeof meta !== 'object') return null;
    const budget = meta.budget && typeof meta.budget === 'object' ? meta.budget : {};
    return {
        included: Boolean(meta.included),
        selectedItemCount: numberOrZero(meta.selectedItemCount),
        selectedQuestCount: numberOrZero(meta.selectedQuestCount),
        selectedProcessCount: numberOrZero(meta.selectedProcessCount),
        selectedAchievementCount: numberOrZero(meta.selectedAchievementCount),
        selectedInventoryCount: numberOrZero(meta.selectedInventoryCount),
        selectedItemIds: Array.isArray(meta.selectedItemIds)
            ? meta.selectedItemIds.slice(0, 12)
            : [],
        selectedQuestIds: Array.isArray(meta.selectedQuestIds)
            ? meta.selectedQuestIds.slice(0, 12)
            : [],
        selectedProcessIds: Array.isArray(meta.selectedProcessIds)
            ? meta.selectedProcessIds.slice(0, 12)
            : [],
        selectedAchievementIds: Array.isArray(meta.selectedAchievementIds)
            ? meta.selectedAchievementIds.slice(0, 12)
            : [],
        renderedChars: numberOrZero(meta.renderedChars),
        budget: {
            maxItems: numberOrZero(budget.maxItems),
            maxQuests: numberOrZero(budget.maxQuests),
            maxProcesses: numberOrZero(budget.maxProcesses),
            maxAchievements: numberOrZero(budget.maxAchievements),
            maxTotalChars: numberOrZero(budget.maxTotalChars),
            maxEntityChars: numberOrZero(budget.maxEntityChars),
            maxSources: numberOrZero(budget.maxSources),
        },
        reasonCodes: Array.isArray(meta.reasonCodes) ? meta.reasonCodes.slice(0, 12) : [],
        truncated: Boolean(meta.truncated),
        sourcesTruncated: Boolean(meta.sourcesTruncated),
    };
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
        focusedGameData: sanitizeFocusedGameData(metadata.contextPlan?.focusedGameData),
        playerStateSummary: sanitizePlayerStateSummary(metadata.playerStateSummary),
    };
};
