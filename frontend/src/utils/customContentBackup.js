import { db } from './customcontent.js';
import { getItems, getProcesses, getQuests } from './indexeddb.js';

export const BACKUP_SCHEMA_VERSION = 1;

const BACKUP_PREFIX = 'dspace-custom-content-backup';

const assetId = (type, id) => `${type}:${id}`;
const imageAssetId = (type, id) => `${type}-image:${id}`;

const makeLabel = (prefix, value, fallback) => `${prefix}: ${value || fallback}`;

const readBlobAsDataUrl = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
                return;
            }
            reject(new Error('Image data was not a string.'));
        };
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read image data.'));
        reader.readAsDataURL(blob);
    });
};

const ensureImageDataUrl = async (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== 'string') {
        throw new Error('Missing required image data.');
    }

    if (imageUrl.startsWith('data:')) {
        return imageUrl;
    }

    if (typeof fetch !== 'function') {
        throw new Error('Image fetch is unavailable in this environment.');
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Image fetch failed with status ${response.status}.`);
    }

    const blob = await response.blob();
    return readBlobAsDataUrl(blob);
};

export const getCustomContentSnapshot = async () => {
    const [items, processes, quests] = await Promise.all([getItems(), getProcesses(), getQuests()]);
    return {
        items,
        processes,
        quests,
    };
};

export const buildBackupAssetList = ({ items, processes, quests }) => {
    const assets = [];

    items.forEach((item) => {
        assets.push({
            id: assetId('item', item.id),
            label: makeLabel('Item', item.name, item.id),
            kind: 'item',
        });
        assets.push({
            id: imageAssetId('item', item.id),
            label: makeLabel('Item image', item.name, item.id),
            kind: 'item-image',
        });
    });

    processes.forEach((process) => {
        assets.push({
            id: assetId('process', process.id ?? process.title),
            label: makeLabel('Process', process.title, process.id),
            kind: 'process',
        });
    });

    quests.forEach((quest) => {
        assets.push({
            id: assetId('quest', quest.id),
            label: makeLabel('Quest', quest.title, quest.id),
            kind: 'quest',
        });
        assets.push({
            id: imageAssetId('quest', quest.id),
            label: makeLabel('Quest image', quest.title, quest.id),
            kind: 'quest-image',
        });
    });

    return assets;
};

const notifyAsset = (callback, payload) => {
    if (typeof callback === 'function') {
        callback(payload);
    }
};

export const createCustomContentBackupPayload = async (
    { items, processes, quests },
    { onAssetUpdate } = {}
) => {
    if (!Array.isArray(items) || !Array.isArray(processes) || !Array.isArray(quests)) {
        throw new Error('Custom content snapshot is invalid.');
    }

    const preparedItems = [];
    const preparedProcesses = [];
    const preparedQuests = [];

    for (const item of items) {
        const itemId = assetId('item', item.id);
        notifyAsset(onAssetUpdate, { id: itemId, status: 'in-progress' });
        preparedItems.push({ ...item });
        notifyAsset(onAssetUpdate, { id: itemId, status: 'complete' });

        const itemImageId = imageAssetId('item', item.id);
        notifyAsset(onAssetUpdate, { id: itemImageId, status: 'in-progress' });
        try {
            const imageData = await ensureImageDataUrl(item.image);
            preparedItems[preparedItems.length - 1].image = imageData;
            notifyAsset(onAssetUpdate, { id: itemImageId, status: 'complete' });
        } catch (error) {
            notifyAsset(onAssetUpdate, {
                id: itemImageId,
                status: 'error',
                message: error?.message,
            });
            throw new Error(`Item image failed: ${item.name ?? item.id}`);
        }
    }

    for (const process of processes) {
        const processId = assetId('process', process.id ?? process.title);
        notifyAsset(onAssetUpdate, { id: processId, status: 'in-progress' });
        preparedProcesses.push({ ...process });
        notifyAsset(onAssetUpdate, { id: processId, status: 'complete' });
    }

    for (const quest of quests) {
        const questId = assetId('quest', quest.id);
        notifyAsset(onAssetUpdate, { id: questId, status: 'in-progress' });
        preparedQuests.push({ ...quest });
        notifyAsset(onAssetUpdate, { id: questId, status: 'complete' });

        const questImageId = imageAssetId('quest', quest.id);
        notifyAsset(onAssetUpdate, { id: questImageId, status: 'in-progress' });
        try {
            const imageData = await ensureImageDataUrl(quest.image);
            preparedQuests[preparedQuests.length - 1].image = imageData;
            notifyAsset(onAssetUpdate, { id: questImageId, status: 'complete' });
        } catch (error) {
            notifyAsset(onAssetUpdate, {
                id: questImageId,
                status: 'error',
                message: error?.message,
            });
            throw new Error(`Quest image failed: ${quest.title ?? quest.id}`);
        }
    }

    const imageCount =
        preparedItems.filter((item) => item.image).length +
        preparedQuests.filter((quest) => quest.image).length;

    return {
        schemaVersion: BACKUP_SCHEMA_VERSION,
        createdAt: new Date().toISOString(),
        counts: {
            items: preparedItems.length,
            processes: preparedProcesses.length,
            quests: preparedQuests.length,
            images: imageCount,
        },
        items: preparedItems,
        processes: preparedProcesses,
        quests: preparedQuests,
    };
};

export const serializeCustomContentBackup = (payload) => JSON.stringify(payload, null, 2);

export const createCustomContentBackupBlob = (payload) => {
    return new Blob([serializeCustomContentBackup(payload)], {
        type: 'application/json',
    });
};

const pad = (value) => value.toString().padStart(2, '0');

export const createBackupFilename = (date = new Date()) => {
    const timestamp = [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('');
    const time = [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join('');
    return `${BACKUP_PREFIX}-${timestamp}-${time}.json`;
};

const isEmbeddedImage = (image) => typeof image === 'string' && image.startsWith('data:');

const validateBackupPayload = (payload) => {
    if (!payload || typeof payload !== 'object') {
        throw new Error('Backup data is invalid.');
    }

    if (payload.schemaVersion !== BACKUP_SCHEMA_VERSION) {
        throw new Error('Unsupported backup schema version.');
    }

    const { items, processes, quests } = payload;
    if (!Array.isArray(items) || !Array.isArray(processes) || !Array.isArray(quests)) {
        throw new Error('Backup data is missing content arrays.');
    }

    const missingImage =
        items.some((item) => !isEmbeddedImage(item?.image)) ||
        quests.some((quest) => !isEmbeddedImage(quest?.image));
    if (missingImage) {
        throw new Error('Backup data is missing required images.');
    }

    return payload;
};

export const parseCustomContentBackup = (input) => {
    try {
        const payload = typeof input === 'string' ? JSON.parse(input) : input;
        return validateBackupPayload(payload);
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error('Backup file is not valid JSON.');
        }
        throw error;
    }
};

export const importCustomContentBackupPayload = async (payload, { onAssetUpdate } = {}) => {
    const validated = validateBackupPayload(payload);
    const { items, processes, quests } = validated;

    for (const item of items) {
        const itemId = assetId('item', item.id);
        notifyAsset(onAssetUpdate, { id: itemId, status: 'in-progress' });
        await db.items.add({ ...item });
        notifyAsset(onAssetUpdate, { id: itemId, status: 'complete' });

        const itemImageId = imageAssetId('item', item.id);
        notifyAsset(onAssetUpdate, { id: itemImageId, status: 'in-progress' });
        await ensureImageDataUrl(item.image);
        notifyAsset(onAssetUpdate, { id: itemImageId, status: 'complete' });
    }

    for (const process of processes) {
        const processId = assetId('process', process.id ?? process.title);
        notifyAsset(onAssetUpdate, { id: processId, status: 'in-progress' });
        await db.processes.add({ ...process });
        notifyAsset(onAssetUpdate, { id: processId, status: 'complete' });
    }

    for (const quest of quests) {
        const questId = assetId('quest', quest.id);
        notifyAsset(onAssetUpdate, { id: questId, status: 'in-progress' });
        await db.quests.add({ ...quest });
        notifyAsset(onAssetUpdate, { id: questId, status: 'complete' });

        const questImageId = imageAssetId('quest', quest.id);
        notifyAsset(onAssetUpdate, { id: questImageId, status: 'in-progress' });
        await ensureImageDataUrl(quest.image);
        notifyAsset(onAssetUpdate, { id: questImageId, status: 'complete' });
    }
};

export const importCustomContentBackupFile = async (file, { onAssetUpdate } = {}) => {
    if (!file) {
        throw new Error('Backup file is required.');
    }

    const text = await file.text();
    const payload = parseCustomContentBackup(text);
    await importCustomContentBackupPayload(payload, { onAssetUpdate });
    return payload;
};
