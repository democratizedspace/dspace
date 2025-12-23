import { isValidGitHubToken } from '../../utils/githubToken.js';

const BACKUP_DESCRIPTION = 'DSPACE Cloud Sync backup';
const BACKUP_FILENAME_PREFIX = 'dspace-save-';
const SECRET_KEYS = new Set([
    'token',
    'accesstoken',
    'refreshtoken',
    'sessiontoken',
    'authtoken',
    'authorization',
]);
const STRIP_NAMESPACES = new Set(['github', 'session', 'auth']);

const buildHeaders = (token) => ({
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
});

function scrubSecrets(value) {
    if (!value || typeof value !== 'object') {
        return;
    }

    if (Array.isArray(value)) {
        value.forEach((entry) => scrubSecrets(entry));
        return;
    }

    for (const key of Object.keys(value)) {
        const lowered = key.toLowerCase();
        if (STRIP_NAMESPACES.has(lowered) || SECRET_KEYS.has(lowered)) {
            delete value[key];
            continue;
        }

        scrubSecrets(value[key]);

        if (value[key] && typeof value[key] === 'object' && Object.keys(value[key]).length === 0) {
            delete value[key];
        }
    }
}

function sanitizeSaveForBackup(saveState) {
    const cloned =
        typeof structuredClone === 'function'
            ? structuredClone(saveState || {})
            : JSON.parse(JSON.stringify(saveState || {}));
    scrubSecrets(cloned);
    return cloned;
}

function formatBackupFilename(date = new Date()) {
    const iso = date.toISOString().replace(/:/g, '-');
    return `${BACKUP_FILENAME_PREFIX}${iso}.txt`;
}

async function validateToken(token, fetcher = fetch) {
    const trimmed = token?.trim() ?? '';

    if (!trimmed) {
        throw new Error('Token is required');
    }

    if (!isValidGitHubToken(trimmed)) {
        throw new Error('GitHub token looks invalid');
    }

    const response = await fetcher('https://api.github.com/gists?per_page=1', {
        headers: buildHeaders(trimmed),
    });

    if (!response.ok) {
        throw new Error('Unable to verify GitHub token');
    }

    return trimmed;
}

async function listBackups(token, fetcher = fetch) {
    const response = await fetcher('https://api.github.com/gists?per_page=30', {
        headers: buildHeaders(token),
    });

    if (!response.ok) {
        throw new Error('Failed to load backups');
    }

    const gists = (await response.json()) || [];

    return gists
        .filter(
            (gist) =>
                gist?.description === BACKUP_DESCRIPTION ||
                Object.keys(gist?.files || {}).some((name) =>
                    name.startsWith(BACKUP_FILENAME_PREFIX)
                )
        )
        .map((gist) => {
            const [filename] = Object.keys(gist.files || {});
            return {
                id: gist.id,
                html_url: gist.html_url,
                created_at: gist.created_at,
                filename,
            };
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

async function createBackupGist({ token, content, fetcher = fetch, now = new Date() }) {
    const response = await fetcher('https://api.github.com/gists', {
        method: 'POST',
        headers: buildHeaders(token),
        body: JSON.stringify({
            description: BACKUP_DESCRIPTION,
            public: false,
            files: {
                [formatBackupFilename(now)]: { content },
            },
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to create backup gist');
    }

    return response.json();
}

export {
    BACKUP_DESCRIPTION,
    BACKUP_FILENAME_PREFIX,
    createBackupGist,
    formatBackupFilename,
    listBackups,
    sanitizeSaveForBackup,
    validateToken,
};
