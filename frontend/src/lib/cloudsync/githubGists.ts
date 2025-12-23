const BACKUP_DESCRIPTION = 'DSPACE Cloud Sync backup';
const BACKUP_FILENAME_PREFIX = 'dspace-save-';

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const secretKeys = new Set(['token', 'apiKey', 'auth', 'session']);

const cloneState = (value: unknown) => {
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value ?? {}));
};

const scrubSecrets = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map((entry) => scrubSecrets(entry));
    }

    if (value && typeof value === 'object') {
        return Object.entries(value as Record<string, unknown>).reduce(
            (acc, [key, val]) => {
                if (secretKeys.has(key)) {
                    return acc;
                }
                acc[key] = scrubSecrets(val);
                return acc;
            },
            {} as Record<string, unknown>
        );
    }

    return value;
};

export const sanitizeSaveForBackup = <T>(save: T): T => {
    const cloned = cloneState(save ?? {}) as T;
    return scrubSecrets(cloned) as T;
};

export const formatBackupFilename = (date = new Date()) => {
    const iso = date
        .toISOString()
        .replace(/:/g, '-')
        .replace(/\.\d{3}Z$/, 'Z');
    return `${BACKUP_FILENAME_PREFIX}${iso}.txt`;
};

export const looksLikeGitHubToken = (token: string) => {
    if (!token) return false;
    const trimmed = token.trim();
    if (!trimmed) return false;
    const patterns = [/^gh[pousr]_[A-Za-z0-9_]{20,}$/i, /^github_pat_[A-Za-z0-9_]{22,}$/i];
    return patterns.some((p) => p.test(trimmed)) || trimmed.length >= 20;
};

export const validateToken = async (token: string, fetchImpl: FetchLike = fetch) => {
    if (!looksLikeGitHubToken(token)) {
        return { ok: false, reason: 'Invalid token format' } as const;
    }

    const response = await fetchImpl('https://api.github.com/gists?per_page=1', {
        headers: { Authorization: `token ${token.trim()}` },
    });

    if (!response.ok) {
        return { ok: false, reason: 'GitHub token validation failed' } as const;
    }

    return { ok: true } as const;
};

export const createBackupGist = async (
    token: string,
    content: string,
    fetchImpl: FetchLike = fetch,
    now: Date = new Date()
) => {
    const filename = formatBackupFilename(now);
    const body = {
        description: BACKUP_DESCRIPTION,
        public: false,
        files: {
            [filename]: { content },
        },
    };

    const res = await fetchImpl('https://api.github.com/gists', {
        method: 'POST',
        headers: {
            Authorization: `token ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error('Failed to create backup gist');
    }

    const data = await res.json();

    return {
        id: data.id,
        htmlUrl: data.html_url,
        createdAt: data.created_at,
        filename,
    };
};

type GistFileMap = Record<string, { filename?: string; content?: string }>;

type GistSummary = {
    id: string;
    html_url: string;
    created_at: string;
    description?: string;
    files?: GistFileMap;
};

export type BackupListItem = {
    id: string;
    htmlUrl: string;
    createdAt: string;
    filename: string;
};

const isBackupGist = (gist: GistSummary) => {
    if (gist?.description === BACKUP_DESCRIPTION) return true;
    return Object.keys(gist?.files ?? {}).some((name) => name.startsWith(BACKUP_FILENAME_PREFIX));
};

export const listBackups = async (token: string, fetchImpl: FetchLike = fetch) => {
    const res = await fetchImpl('https://api.github.com/gists?per_page=30', {
        headers: token ? { Authorization: `token ${token}` } : {},
    });

    if (!res.ok) {
        throw new Error('Failed to list gists');
    }

    const data = (await res.json()) as GistSummary[];

    return data
        .filter(isBackupGist)
        .map((gist) => ({
            id: gist.id,
            htmlUrl: gist.html_url,
            createdAt: gist.created_at,
            filename:
                Object.keys(gist.files ?? {}).find((name) =>
                    name.startsWith(BACKUP_FILENAME_PREFIX)
                ) ?? '',
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const constants = {
    BACKUP_DESCRIPTION,
    BACKUP_FILENAME_PREFIX,
};
