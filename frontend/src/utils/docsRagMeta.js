const STALE_WARNING_TEXT = 'Docs RAG is stale vs app build.';

export const normalizeGitSha = (value) => {
    const normalized = String(value || '').trim();
    return normalized || 'unknown';
};

export const getDocsRagMismatchWarning = (appSha, docsSha) => {
    const normalizedApp = normalizeGitSha(appSha);
    const normalizedDocs = normalizeGitSha(docsSha);

    if (normalizedApp === normalizedDocs) {
        return null;
    }

    return STALE_WARNING_TEXT;
};

export const getDocsRagMismatchWarningText = () => STALE_WARNING_TEXT;
