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
        playerState: metadata.playerStateSummary
            ? {
                  mode:
                      metadata.playerStateSummary.playerStatePromptMode ||
                      metadata.playerStateSummary.mode ||
                      (metadata.playerStateSummary.included ? 'compact' : 'none'),
                  completedQuestCount: Number(metadata.playerStateSummary.completedQuestCount || 0),
                  totalOfficialQuestCount: Number(
                      metadata.playerStateSummary.totalOfficialQuestCount || 0
                  ),
                  remainingOfficialQuestCount: Number(
                      metadata.playerStateSummary.remainingOfficialQuestCount || 0
                  ),
                  remainingQuestIncludedCount: Number(
                      metadata.playerStateSummary.remainingQuestIncludedCount || 0
                  ),
                  inventoryTotalCount: Number(metadata.playerStateSummary.inventoryTotalCount || 0),
                  inventoryIncludedCount: Number(
                      metadata.playerStateSummary.inventoryIncludedCount || 0
                  ),
                  inventoryTruncated: Boolean(metadata.playerStateSummary.inventoryTruncated),
                  activeProcessIncludedCount: Number(
                      metadata.playerStateSummary.activeProcessIncludedCount || 0
                  ),
                  compactStateBlockChars: Number(
                      metadata.playerStateSummary.compactStateBlockChars || 0
                  ),
              }
            : null,
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
    };
};
