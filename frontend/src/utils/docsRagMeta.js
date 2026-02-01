export const getDocsRagStalenessWarning = (appSha, docsSha) => {
    const normalizedApp = String(appSha ?? 'unknown').trim();
    const normalizedDocs = String(docsSha ?? 'unknown').trim();

    if (!normalizedApp || !normalizedDocs || normalizedApp === normalizedDocs) {
        return null;
    }

    return 'Docs RAG is stale vs app build.';
};
