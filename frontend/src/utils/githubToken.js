export function isValidGitHubToken(token) {
    if (!token) return false;
    const trimmed = token.trim();
    const patterns = [/^gh[pousr]_[A-Za-z0-9_]{36,}$/i, /^github_pat_[A-Za-z0-9_]{22,}$/i];
    return patterns.some((p) => p.test(trimmed));
}
