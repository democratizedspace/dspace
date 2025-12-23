const BACKUP_DESCRIPTION = 'DSPACE Cloud Sync backup';
const BACKUP_FILENAME_PREFIX = 'dspace-save-';

export type BackupFile = { filename?: string; content?: string };
export type GistBackup = {
    id: string;
    created_at?: string;
    html_url?: string;
    description?: string;
    files?: Record<string, BackupFile>;
};

const tokenPatterns = [/^gh[pousr]_[A-Za-z0-9_]{36,}$/i, /^github_pat_[A-Za-z0-9_]{22,}$/i];

const hasNativeBase64 = typeof btoa === 'function';

const defaultFetch: typeof fetch = (...args) => fetch(...args);

const encodeBase64 = (value: string) => {
    if (hasNativeBase64) {
        return btoa(value);
    }

    if (typeof Buffer !== 'undefined') {
        return Buffer.from(value, 'utf8').toString('base64');
    }

    throw new Error('Base64 encoding is not supported in this environment');
};

const stripTokenFields = (record?: Record<string, unknown>) => {
    if (!record || typeof record !== 'object') {
        return;
    }

    const mutable = record as Record<string, unknown>;

    for (const key of Object.keys(mutable)) {
        if (key.toLowerCase().includes('token')) {
            delete mutable[key];
        }
    }
};

export const sanitizeSaveForBackup = (save: Record<string, unknown>) => {
    const cloned = structuredClone(save ?? {});

    if (cloned && typeof cloned === 'object') {
        stripTokenFields(cloned as Record<string, unknown>);
        stripTokenFields((cloned as Record<string, unknown>).github as Record<string, unknown>);
        stripTokenFields((cloned as Record<string, unknown>).auth as Record<string, unknown>);
        stripTokenFields((cloned as Record<string, unknown>).session as Record<string, unknown>);

        if (
            (cloned as Record<string, unknown>).github &&
            Object.keys((cloned as Record<string, unknown>).github as Record<string, unknown>)
                .length === 0
        ) {
            delete (cloned as Record<string, unknown>).github;
        }
    }

    return cloned;
};

export const formatBackupFilename = (date = new Date()) => {
    const iso = date.toISOString().replace(/:/g, '-');
    return `${BACKUP_FILENAME_PREFIX}${iso}.txt`;
};

export const isLikelyGitHubToken = (token: string | undefined | null) => {
    if (!token || typeof token !== 'string') {
        return false;
    }

    const trimmed = token.trim();
    if (!trimmed) {
        return false;
    }

    return tokenPatterns.some((pattern) => pattern.test(trimmed)) || trimmed.length > 0;
};

const authHeaders = (token: string) => ({
    Authorization: `token ${token.trim()}`,
    Accept: 'application/vnd.github+json',
});

export const validateToken = async (token: string, fetchImpl = defaultFetch) => {
    if (!isLikelyGitHubToken(token)) {
        throw new Error('Invalid GitHub token');
    }

    const response = await fetchImpl('https://api.github.com/gists?per_page=1', {
        headers: authHeaders(token),
        method: 'GET',
    });

    if (!response.ok) {
        throw new Error('GitHub token validation failed');
    }

    return true;
};

const encodeBackupContent = (state: Record<string, unknown>) => {
    const sanitized = sanitizeSaveForBackup(state);
    return encodeBase64(JSON.stringify(sanitized));
};

export const findBackupFile = (files?: Record<string, BackupFile>) => {
    if (!files) {
        return undefined;
    }

    if (files['dspace-save.json']?.content) {
        return files['dspace-save.json'];
    }

    const entries = Object.values(files).filter((file) =>
        (file?.filename || '').startsWith(BACKUP_FILENAME_PREFIX)
    );

    if (entries.length === 0) {
        return undefined;
    }

    return entries.sort((a, b) => (b.filename || '').localeCompare(a.filename || ''))[0];
};

export const createBackupGist = async ({
    token,
    state,
    fetchImpl = defaultFetch,
    date = new Date(),
}: {
    token: string;
    state: Record<string, unknown>;
    fetchImpl?: typeof fetch;
    date?: Date;
}): Promise<GistBackup> => {
    const fileName = formatBackupFilename(date);
    const content = encodeBackupContent(state);

    const response = await fetchImpl('https://api.github.com/gists', {
        method: 'POST',
        headers: {
            ...authHeaders(token),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            description: BACKUP_DESCRIPTION,
            public: false,
            files: { [fileName]: { content } },
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to create backup gist');
    }

    const gist = await response.json();
    return gist as GistBackup;
};

export const listBackups = async (
    token: string,
    fetchImpl = defaultFetch
): Promise<GistBackup[]> => {
    const response = await fetchImpl('https://api.github.com/gists?per_page=30', {
        headers: authHeaders(token),
    });

    if (!response.ok) {
        throw new Error('Failed to fetch backups');
    }

    const gists = await response.json();
    if (!Array.isArray(gists)) {
        return [];
    }

    return gists
        .filter((gist) => {
            const descriptionMatch =
                gist?.description === BACKUP_DESCRIPTION ||
                gist?.description === 'DSPACE cloud save';
            const backupFile = findBackupFile(gist?.files);
            return descriptionMatch || Boolean(backupFile);
        })
        .sort((a, b) => (b?.created_at || '').localeCompare(a?.created_at || '')) as GistBackup[];
};

export { BACKUP_DESCRIPTION, BACKUP_FILENAME_PREFIX };
