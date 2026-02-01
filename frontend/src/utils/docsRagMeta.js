export const resolveDocsRagMeta = ({ meta, buildSha }) => {
    const normalizedBuildSha = String(buildSha || '').trim() || 'unknown';
    const normalizedDocsSha = String(meta?.gitSha || '').trim() || 'unknown';
    const generatedAt = meta?.generatedAt || 'unknown';
    const hasMismatch =
        normalizedBuildSha !== 'unknown' &&
        normalizedDocsSha !== 'unknown' &&
        normalizedBuildSha !== normalizedDocsSha;

    return {
        appSha: normalizedBuildSha,
        docsSha: normalizedDocsSha,
        generatedAt,
        hasMismatch,
        warning: hasMismatch ? 'Docs RAG is stale vs app build.' : '',
    };
};
