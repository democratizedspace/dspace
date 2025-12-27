export const BACKUP_DESCRIPTION = 'DSPACE Cloud Sync backup';
export const BACKUP_FILE_PREFIX = 'dspace-save';

const TOKEN_PATTERNS = [/^gh[pousr]_[A-Za-z0-9_]{36,}$/i, /^github_pat_[A-Za-z0-9_]{22,}$/i];

const resolveFetch = (fetchImpl?: typeof fetch) =>
    fetchImpl ?? (typeof fetch !== 'undefined' ? fetch : undefined);

export const isLikelyGitHubToken = (token?: string) => {
    if (typeof token !== 'string') return false;
    const trimmed = token.trim();
    if (!trimmed) return false;
    return TOKEN_PATTERNS.some((pattern) => pattern.test(trimmed));
};

export function formatBackupFilename(date = new Date()) {
    const timestamp = date.toISOString().replace(/:/g, '-');
    return `${BACKUP_FILE_PREFIX}-${timestamp}.txt`;
}

const SENSITIVE_KEYWORDS = [
    'token',
    'session',
    'password',
    'passphrase',
    'secret',
    'api-key',
    'apikey',
    'api_key',
    'privatekey',
    'private-key',
    'private_key',
    'authorization',
    'credential',
];

function removeSensitiveFields(subject: unknown): void {
    if (!subject || typeof subject !== 'object') return;
    if (Array.isArray(subject)) {
        subject.forEach((item) => removeSensitiveFields(item));
        return;
    }

    for (const key of Object.keys(subject)) {
        const lowered = key.toLowerCase();
        const isSensitive = SENSITIVE_KEYWORDS.some((keyword) => lowered.includes(keyword));
        if (isSensitive) {
            delete (subject as Record<string, unknown>)[key];
            continue;
        }
        removeSensitiveFields((subject as Record<string, unknown>)[key]);
    }
}

export function sanitizeSaveForBackup(save: unknown) {
    const source = save ?? {};
    const clone =
        typeof structuredClone === 'function'
            ? structuredClone(source)
            : JSON.parse(JSON.stringify(source));
    removeSensitiveFields(clone);
    return clone;
}

export async function validateToken(token: string, fetchImpl?: typeof fetch) {
    const activeFetch = resolveFetch(fetchImpl);
    if (!activeFetch) throw new Error('Fetch implementation unavailable');
    const trimmedToken = token?.trim?.() ?? '';
    if (!isLikelyGitHubToken(trimmedToken)) {
        throw new Error('Token is missing or appears invalid');
    }

    const response = await activeFetch('https://api.github.com/gists?per_page=1', {
        headers: {
            Authorization: `token ${trimmedToken}`,
            Accept: 'application/vnd.github+json',
        },
    });

    if (!response.ok) {
        throw new Error('Token validation failed');
    }

    return true;
}

export async function listBackups(token: string, fetchImpl?: typeof fetch) {
    const activeFetch = resolveFetch(fetchImpl);
    if (!activeFetch) throw new Error('Fetch implementation unavailable');
    const trimmedToken = token?.trim?.() ?? '';

    const response = await activeFetch('https://api.github.com/gists?per_page=30', {
        headers: {
            Authorization: `token ${trimmedToken}`,
            Accept: 'application/vnd.github+json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to load gists');
    }

    const payload = await response.json();
    if (!Array.isArray(payload)) return [];

    return payload
        .filter((gist) => {
            const hasDescription = gist?.description === BACKUP_DESCRIPTION;
            const fileNames = Object.keys(gist?.files || {});
            const hasBackupFile = fileNames.some((name) => name.startsWith(BACKUP_FILE_PREFIX));
            return hasDescription || hasBackupFile;
        })
        .map((gist) => {
            const files = gist?.files || {};
            const filename = Object.keys(files).find((name) => name.startsWith(BACKUP_FILE_PREFIX));
            return {
                id: gist?.id,
                createdAt: gist?.created_at,
                htmlUrl: gist?.html_url,
                filename,
            };
        })
        .filter((item) => Boolean(item.id))
        .sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
}

export async function createBackupGist({
    token,
    content,
    description = BACKUP_DESCRIPTION,
    date = new Date(),
    fetchImpl,
}: {
    token: string;
    content: string;
    description?: string;
    date?: Date;
    fetchImpl?: typeof fetch;
}) {
    const activeFetch = resolveFetch(fetchImpl);
    if (!activeFetch) throw new Error('Fetch implementation unavailable');
    const trimmedToken = token?.trim?.() ?? '';

    const filename = formatBackupFilename(date);
    const response = await activeFetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
            Authorization: `token ${trimmedToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify({
            description,
            public: false,
            files: {
                [filename]: { content },
            },
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to create backup gist');
    }

    const body = await response.json();
    return {
        id: body?.id,
        createdAt: body?.created_at,
        htmlUrl: body?.html_url,
        filename,
    };
}
