import {
    importGameStateString,
    loadGameState,
    saveGameState,
    ready,
    buildGameStateBackupEnvelope,
    encodeBackupEnvelope,
} from './gameState/common.js';
import { loadGitHubToken } from './githubToken.js';
import {
    BACKUP_DESCRIPTION,
    BACKUP_FILE_PREFIX,
    createBackupGist,
    listBackups,
} from '../lib/cloudsync/githubGists';
import {
    BACKUP_SCHEMA_VERSION as CUSTOM_CONTENT_SCHEMA_VERSION,
    buildCustomContentBackupData,
} from './customContentBackup.js';
import { db, ENTITY_TYPES } from './customcontent.js';

const sanitizeCustomEntity = (entity) => {
    if (!entity || typeof entity !== 'object') {
        return entity;
    }
    const sanitized = { ...entity };
    if ('imageBlob' in sanitized) {
        delete sanitized.imageBlob;
    }
    return sanitized;
};

const buildFallbackCustomContentBackup = async () => {
    const [items, processes, quests] = await Promise.all([
        db.list(ENTITY_TYPES.ITEM),
        db.list(ENTITY_TYPES.PROCESS),
        db.list(ENTITY_TYPES.QUEST),
    ]);
    const sanitizedItems = items.map((item) => sanitizeCustomEntity(item));
    const sanitizedProcesses = processes.map((process) => sanitizeCustomEntity(process));
    const sanitizedQuests = quests.map((quest) => sanitizeCustomEntity(quest));

    return {
        schemaVersion: CUSTOM_CONTENT_SCHEMA_VERSION,
        timestamp: new Date().toISOString(),
        counts: {
            items: sanitizedItems.length,
            processes: sanitizedProcesses.length,
            quests: sanitizedQuests.length,
            images: 0,
        },
        items: sanitizedItems,
        processes: sanitizedProcesses,
        quests: sanitizedQuests,
        images: [],
    };
};

async function loadCloudGistId() {
    await ready;
    const state = loadGameState();
    return state.cloudSync?.gistId || '';
}

async function clearCloudGistId() {
    await ready;
    const state = loadGameState();
    if (state.cloudSync) {
        state.cloudSync.gistId = '';
    }
    await saveGameState(state);
}

async function uploadGameStateToGist(token) {
    if (!token) {
        token = await loadGitHubToken();
    }
    await ready;
    const state = loadGameState();
    const envelope = buildGameStateBackupEnvelope({
        providerHint: 'github-gist',
        stateOverride: state,
    });
    try {
        envelope.customContent = await buildCustomContentBackupData();
    } catch (error) {
        console.warn(
            'Failed to include custom content in cloud sync backup, using fallback:',
            error
        );
        envelope.customContent = await buildFallbackCustomContentBackup();
    }
    const content = encodeBackupEnvelope(envelope);
    const result = await createBackupGist({
        token,
        content,
        description: BACKUP_DESCRIPTION,
    });
    await clearCloudGistId();
    return result;
}

async function downloadGameStateFromGist(token, gistId) {
    if (!gistId) {
        gistId = await loadCloudGistId();
    }
    if (!gistId) throw new Error('No gist id specified');
    if (!token) {
        token = await loadGitHubToken();
    }
    const trimmedToken = token?.trim?.();
    const headers = trimmedToken ? { Authorization: `token ${trimmedToken}` } : {};
    const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
    if (!res.ok) throw new Error('Failed to download game state');
    const data = await res.json();
    const files = data.files || {};
    const backupFile =
        Object.values(files).find((file) => file?.filename?.startsWith(BACKUP_FILE_PREFIX)) ||
        files['dspace-save.json'];
    const content = backupFile?.content;
    if (!content) throw new Error('Invalid gist content');
    await importGameStateString(content);
}

async function fetchBackupList(token) {
    return listBackups(token);
}

export {
    loadCloudGistId,
    uploadGameStateToGist,
    downloadGameStateFromGist,
    clearCloudGistId,
    fetchBackupList,
};
