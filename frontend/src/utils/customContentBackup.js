import { getItems, getProcesses, getQuests } from './indexeddb.js';
import { db } from './customcontent.js';

export const BACKUP_SCHEMA_VERSION = 1;

const SUPPORTED_IMAGE_OWNERS = new Set(['item', 'quest']);

const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));

const formatDatePart = (value) => String(value).padStart(2, '0');

const formatBackupTimestamp = (date = new Date()) => {
    const year = date.getFullYear();
    const month = formatDatePart(date.getMonth() + 1);
    const day = formatDatePart(date.getDate());
    const hours = formatDatePart(date.getHours());
    const minutes = formatDatePart(date.getMinutes());
    const seconds = formatDatePart(date.getSeconds());
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
};

export const buildBackupFilename = (date = new Date()) =>
    `dspace-custom-content-backup-${formatBackupTimestamp(date)}.json`;

const normalizeLabel = (value, fallback) => {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
    }
    return fallback;
};

const buildImageEntries = ({ items, quests }) => {
    const images = [];

    items.forEach((item) => {
        if (item?.image) {
            images.push({
                ownerType: 'item',
                ownerId: item.id,
                data: item.image,
            });
        }
    });

    quests.forEach((quest) => {
        if (quest?.image) {
            images.push({
                ownerType: 'quest',
                ownerId: quest.id,
                data: quest.image,
            });
        }
    });

    return images;
};

const buildAssetPlan = ({ items, processes, quests, images }) => {
    const assets = [];

    items.forEach((item) => {
        assets.push({
            id: `item:${item.id}`,
            label: `Item: ${normalizeLabel(item.name, item.id)}`,
            kind: 'item',
        });
    });

    processes.forEach((process) => {
        assets.push({
            id: `process:${process.id}`,
            label: `Process: ${normalizeLabel(process.title, process.id)}`,
            kind: 'process',
        });
    });

    quests.forEach((quest) => {
        assets.push({
            id: `quest:${quest.id}`,
            label: `Quest: ${normalizeLabel(quest.title, quest.id)}`,
            kind: 'quest',
        });
    });

    images.forEach((image) => {
        const ownerLabel = normalizeLabel(image.ownerId, 'unknown');
        assets.push({
            id: `image:${image.ownerType}:${image.ownerId}`,
            label: `${image.ownerType === 'item' ? 'Item' : 'Quest'} image: ${ownerLabel}`,
            kind: 'image',
        });
    });

    return assets;
};

const validateBackupPayload = (payload) => {
    if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid backup file');
    }

    if (payload.schemaVersion !== BACKUP_SCHEMA_VERSION) {
        throw new Error('Unsupported backup schema version');
    }

    if (!Array.isArray(payload.items) || !Array.isArray(payload.processes)) {
        throw new Error('Invalid backup file');
    }

    if (!Array.isArray(payload.quests)) {
        throw new Error('Invalid backup file');
    }

    if (payload.images && !Array.isArray(payload.images)) {
        throw new Error('Invalid backup file');
    }

    return {
        items: payload.items,
        processes: payload.processes,
        quests: payload.quests,
        images: Array.isArray(payload.images) ? payload.images : [],
    };
};

const createImageMap = (images) => {
    const imageMap = new Map();

    images.forEach((image) => {
        if (!image || typeof image !== 'object') {
            throw new Error('Invalid backup file');
        }
        if (!SUPPORTED_IMAGE_OWNERS.has(image.ownerType)) {
            throw new Error('Invalid backup file');
        }
        if (image.ownerId == null || typeof image.data !== 'string') {
            throw new Error('Invalid backup file');
        }

        imageMap.set(`${image.ownerType}:${image.ownerId}`, image.data);
    });

    return imageMap;
};

const updateProgress = (onProgress, asset, status) => {
    if (typeof onProgress === 'function') {
        onProgress({
            id: asset.id,
            status,
        });
    }
};

const processAssets = async (assets, onProgress) => {
    for (const asset of assets) {
        updateProgress(onProgress, asset, 'processing');
        await yieldToBrowser();
        updateProgress(onProgress, asset, 'complete');
    }
};

export async function prepareCustomContentBackup({ onPlanReady, onProgress } = {}) {
    const [items, processes, quests] = await Promise.all([
        getItems(),
        getProcesses(),
        getQuests(),
    ]);
    const images = buildImageEntries({ items, quests });
    const assets = buildAssetPlan({ items, processes, quests, images });

    if (typeof onPlanReady === 'function') {
        onPlanReady(assets);
    }

    const payload = {
        schemaVersion: BACKUP_SCHEMA_VERSION,
        createdAt: new Date().toISOString(),
        counts: {
            items: items.length,
            processes: processes.length,
            quests: quests.length,
            images: images.length,
        },
        items,
        processes,
        quests,
        images,
    };

    await processAssets(assets, onProgress);

    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });

    return {
        blob,
        filename: buildBackupFilename(),
        payload,
        assets,
    };
}

export async function importCustomContentBackupFile(file, { onPlanReady, onProgress } = {}) {
    if (!file) {
        throw new Error('No backup file selected');
    }

    let parsed;
    try {
        const raw = await file.text();
        parsed = JSON.parse(raw);
    } catch (error) {
        throw new Error('Invalid backup file');
    }

    const { items, processes, quests, images } = validateBackupPayload(parsed);
    const imageMap = createImageMap(images);
    const assets = buildAssetPlan({ items, processes, quests, images });

    if (typeof onPlanReady === 'function') {
        onPlanReady(assets);
    }

    for (const image of images) {
        const asset = {
            id: `image:${image.ownerType}:${image.ownerId}`,
            label: `${image.ownerType === 'item' ? 'Item' : 'Quest'} image: ${image.ownerId}`,
            kind: 'image',
        };
        updateProgress(onProgress, asset, 'processing');
        await yieldToBrowser();
        updateProgress(onProgress, asset, 'complete');
    }

    for (const item of items) {
        const asset = {
            id: `item:${item.id}`,
            label: `Item: ${normalizeLabel(item.name, item.id)}`,
            kind: 'item',
        };
        updateProgress(onProgress, asset, 'processing');
        try {
            const imageOverride = imageMap.get(`item:${item.id}`);
            await db.items.add({
                ...item,
                image: imageOverride ?? item.image,
            });
            updateProgress(onProgress, asset, 'complete');
        } catch (error) {
            updateProgress(onProgress, asset, 'error');
            throw new Error(`Failed to import ${asset.label}`);
        }
        await yieldToBrowser();
    }

    for (const process of processes) {
        const asset = {
            id: `process:${process.id}`,
            label: `Process: ${normalizeLabel(process.title, process.id)}`,
            kind: 'process',
        };
        updateProgress(onProgress, asset, 'processing');
        try {
            await db.processes.add(process);
            updateProgress(onProgress, asset, 'complete');
        } catch (error) {
            updateProgress(onProgress, asset, 'error');
            throw new Error(`Failed to import ${asset.label}`);
        }
        await yieldToBrowser();
    }

    for (const quest of quests) {
        const asset = {
            id: `quest:${quest.id}`,
            label: `Quest: ${normalizeLabel(quest.title, quest.id)}`,
            kind: 'quest',
        };
        updateProgress(onProgress, asset, 'processing');
        try {
            const imageOverride = imageMap.get(`quest:${quest.id}`);
            await db.quests.add({
                ...quest,
                image: imageOverride ?? quest.image,
            });
            updateProgress(onProgress, asset, 'complete');
        } catch (error) {
            updateProgress(onProgress, asset, 'error');
            throw new Error(`Failed to import ${asset.label}`);
        }
        await yieldToBrowser();
    }
}
