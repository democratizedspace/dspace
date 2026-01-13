import { getItems, getProcesses, getQuests } from './indexeddb.js';
import { db } from './customcontent.js';
import { isBrowser } from './ssr.js';

export const BACKUP_SCHEMA_VERSION = 1;

const IMAGE_DATA_PREFIX = 'data:image';
const DATA_URL_PREFIX = 'data:';
const DEFAULT_IMAGE_MIME = 'application/octet-stream';
const MAX_BACKUP_FILE_SIZE = 50 * 1024 * 1024;
const IMAGE_FETCH_TIMEOUT_MS = 30000;
const INVALID_SVG_PREFIX = 'data:image/svg+xml';
const ALLOWED_IMAGE_DATA_PREFIXES = [
    'data:image/png',
    'data:image/jpeg',
    'data:image/jpg',
    'data:image/gif',
    'data:image/webp',
    'data:application/octet-stream',
];

function padNumber(value) {
    return String(value).padStart(2, '0');
}

export function createBackupFilename(date = new Date()) {
    const year = date.getFullYear();
    const month = padNumber(date.getMonth() + 1);
    const day = padNumber(date.getDate());
    const hours = padNumber(date.getHours());
    const minutes = padNumber(date.getMinutes());
    const seconds = padNumber(date.getSeconds());

    return `dspace-custom-content-backup-${year}${month}${day}-${hours}${minutes}${seconds}.json`;
}

function sanitizeEntity(entity) {
    if (!entity || typeof entity !== 'object') {
        return entity;
    }

    const sanitized = { ...entity };
    if ('imageBlob' in sanitized) {
        delete sanitized.imageBlob;
    }
    return sanitized;
}

function formatAssetLabel(kind, entity) {
    const id = entity?.id ?? 'unknown';
    const name = entity?.title || entity?.name || id;
    switch (kind) {
        case 'item':
            return `Item: ${name}`;
        case 'item-image':
            return `Item image: ${name}`;
        case 'process':
            return `Process: ${name}`;
        case 'quest':
            return `Quest: ${name}`;
        case 'quest-image':
            return `Quest image: ${name}`;
        default:
            return String(name);
    }
}

function buildBackupPlan(items, processes, quests) {
    const assets = [];

    items.forEach((item) => {
        assets.push({
            id: `item:${item.id}`,
            kind: 'item',
            label: formatAssetLabel('item', item),
            entity: item,
        });
        if (item?.image || item?.imageBlob) {
            assets.push({
                id: `item-image:${item.id}`,
                kind: 'item-image',
                label: formatAssetLabel('item-image', item),
                entity: item,
            });
        }
    });

    processes.forEach((process) => {
        assets.push({
            id: `process:${process.id}`,
            kind: 'process',
            label: formatAssetLabel('process', process),
            entity: process,
        });
    });

    quests.forEach((quest) => {
        assets.push({
            id: `quest:${quest.id}`,
            kind: 'quest',
            label: formatAssetLabel('quest', quest),
            entity: quest,
        });
        if (quest?.image || quest?.imageBlob) {
            assets.push({
                id: `quest-image:${quest.id}`,
                kind: 'quest-image',
                label: formatAssetLabel('quest-image', quest),
                entity: quest,
            });
        }
    });

    return assets;
}

function emitProgress(onProgress, payload) {
    if (typeof onProgress === 'function') {
        onProgress(payload);
    }
}

async function blobToDataUrl(blob) {
    if (typeof FileReader === 'function') {
        return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result ?? ''));
            reader.onerror = () => reject(reader.error ?? new Error('Failed to read image blob.'));
            reader.readAsDataURL(blob);
        });
    }

    if (typeof Buffer !== 'undefined') {
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const mime = blob.type || DEFAULT_IMAGE_MIME;
        return `data:${mime};base64,${base64}`;
    }

    throw new Error('Unable to encode image data.');
}

function isDataUrl(value) {
    return typeof value === 'string' && value.startsWith(DATA_URL_PREFIX);
}

function isValidImageDataUrl(dataUrl) {
    if (!isDataUrl(dataUrl)) {
        return false;
    }
    if (dataUrl.startsWith(INVALID_SVG_PREFIX)) {
        return false;
    }
    return ALLOWED_IMAGE_DATA_PREFIXES.some((prefix) => dataUrl.startsWith(prefix));
}

async function resolveImageData(entity) {
    if (entity?.imageBlob instanceof Blob) {
        return await blobToDataUrl(entity.imageBlob);
    }

    if (typeof entity?.image === 'string' && entity.image.trim()) {
        const imageSource = entity.image.trim();
        if (isDataUrl(imageSource)) {
            if (!isValidImageDataUrl(imageSource)) {
                throw new Error('Unsupported image format in backup.');
            }
            return imageSource;
        }

        if (!isBrowser || typeof fetch !== 'function') {
            throw new Error('Image export requires browser fetch support.');
        }

        const controller = typeof AbortController === 'function' ? new AbortController() : null;
        const timeoutId = controller
            ? setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS)
            : null;

        try {
            const response = await fetch(imageSource, {
                signal: controller?.signal,
            });
            if (!response.ok) {
                throw new Error(
                    `Image request failed with ${response.status} for URL: ${imageSource}`
                );
            }
            const blob = await response.blob();
            return await blobToDataUrl(blob);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Image fetch timed out for URL: ${imageSource}`);
            }
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to fetch image from ${imageSource}: ${message}`);
        } finally {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        }
    }

    return null;
}

function buildImageRecord(entityType, entityId, dataUrl) {
    return {
        id: `${entityType}:${entityId}:image`,
        entityType,
        entityId,
        dataUrl,
    };
}

export async function buildCustomContentBackupData({ onProgress } = {}) {
    const [items, processes, quests] = await Promise.all([getItems(), getProcesses(), getQuests()]);
    const plan = buildBackupPlan(items, processes, quests);

    emitProgress(onProgress, { type: 'plan', assets: plan });

    const exportedItems = new Map();
    const exportedQuests = new Map();
    const exportedProcesses = [];
    const images = [];

    for (const asset of plan) {
        try {
            if (asset.kind === 'item') {
                exportedItems.set(asset.entity.id, sanitizeEntity(asset.entity));
            } else if (asset.kind === 'process') {
                exportedProcesses.push(sanitizeEntity(asset.entity));
            } else if (asset.kind === 'quest') {
                exportedQuests.set(asset.entity.id, sanitizeEntity(asset.entity));
            } else if (asset.kind === 'item-image') {
                const dataUrl = await resolveImageData(asset.entity);
                if (!dataUrl) {
                    throw new Error('Missing item image data.');
                }
                const target = exportedItems.get(asset.entity.id) ?? sanitizeEntity(asset.entity);
                target.image = dataUrl;
                exportedItems.set(asset.entity.id, target);
                images.push(buildImageRecord('item', asset.entity.id, dataUrl));
            } else if (asset.kind === 'quest-image') {
                const dataUrl = await resolveImageData(asset.entity);
                if (!dataUrl) {
                    throw new Error('Missing quest image data.');
                }
                const target = exportedQuests.get(asset.entity.id) ?? sanitizeEntity(asset.entity);
                target.image = dataUrl;
                exportedQuests.set(asset.entity.id, target);
                images.push(buildImageRecord('quest', asset.entity.id, dataUrl));
            }

            emitProgress(onProgress, { type: 'asset', assetId: asset.id });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            emitProgress(onProgress, { type: 'error', assetId: asset.id, error: message });
            throw new Error(`Failed to process ${asset.label}: ${message}`);
        }
    }

    const itemsArray = Array.from(exportedItems.values());
    const questsArray = Array.from(exportedQuests.values());

    return {
        schemaVersion: BACKUP_SCHEMA_VERSION,
        timestamp: new Date().toISOString(),
        counts: {
            items: itemsArray.length,
            processes: exportedProcesses.length,
            quests: questsArray.length,
            images: images.length,
        },
        items: itemsArray,
        processes: exportedProcesses,
        quests: questsArray,
        images,
    };
}

export async function buildCustomContentBackup({ onProgress } = {}) {
    const data = await buildCustomContentBackupData({ onProgress });
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });

    return {
        data,
        blob,
        filename: createBackupFilename(),
    };
}

function normalizeBackupData(raw) {
    if (!raw || typeof raw !== 'object') {
        throw new Error('Invalid backup data.');
    }

    if (raw.schemaVersion !== BACKUP_SCHEMA_VERSION) {
        throw new Error('Unsupported backup schema version.');
    }

    const items = Array.isArray(raw.items) ? raw.items : null;
    const processes = Array.isArray(raw.processes) ? raw.processes : null;
    const quests = Array.isArray(raw.quests) ? raw.quests : null;
    const images = Array.isArray(raw.images) ? raw.images : null;

    if (!items || !processes || !quests || !images) {
        throw new Error('Invalid backup data.');
    }

    return {
        schemaVersion: raw.schemaVersion,
        timestamp: raw.timestamp ?? null,
        counts: raw.counts ?? null,
        items,
        processes,
        quests,
        images,
    };
}

function buildImportPlan(items, processes, quests, images) {
    const assets = [];

    images.forEach((image) => {
        const name = image?.entityId ?? 'unknown';
        assets.push({
            id: `image:${image.entityType}:${image.entityId}`,
            kind: 'image',
            label: `Image: ${name}`,
        });
    });

    items.forEach((item) => {
        assets.push({
            id: `item:${item.id}`,
            kind: 'item',
            label: formatAssetLabel('item', item),
            entity: item,
        });
    });

    processes.forEach((process) => {
        assets.push({
            id: `process:${process.id}`,
            kind: 'process',
            label: formatAssetLabel('process', process),
            entity: process,
        });
    });

    quests.forEach((quest) => {
        assets.push({
            id: `quest:${quest.id}`,
            kind: 'quest',
            label: formatAssetLabel('quest', quest),
            entity: quest,
        });
    });

    return assets;
}

function assertEntityHasId(entity, label) {
    if (!entity || (typeof entity.id !== 'string' && typeof entity.id !== 'number')) {
        throw new Error(`Invalid ${label} record in backup.`);
    }
}

async function assertNoImportConflicts(items, processes, quests) {
    const [existingItems, existingProcesses, existingQuests] = await Promise.all([
        getItems(),
        getProcesses(),
        getQuests(),
    ]);
    const existingItemIds = new Set(existingItems.map((item) => item.id));
    const existingProcessIds = new Set(existingProcesses.map((process) => process.id));
    const existingQuestIds = new Set(existingQuests.map((quest) => quest.id));

    const conflicts = [];

    items.forEach((item) => {
        if (existingItemIds.has(item.id)) {
            conflicts.push(`item:${item.id}`);
        }
    });
    processes.forEach((process) => {
        if (existingProcessIds.has(process.id)) {
            conflicts.push(`process:${process.id}`);
        }
    });
    quests.forEach((quest) => {
        if (existingQuestIds.has(quest.id)) {
            conflicts.push(`quest:${quest.id}`);
        }
    });

    if (conflicts.length > 0) {
        throw new Error(`Import conflicts with existing data: ${conflicts.join(', ')}`);
    }
}

export async function restoreCustomContentBackup(data, { onProgress } = {}) {
    const normalized = normalizeBackupData(data);
    const items = normalized.items.map((item) => sanitizeEntity(item));
    const processes = normalized.processes.map((process) => sanitizeEntity(process));
    const quests = normalized.quests.map((quest) => sanitizeEntity(quest));
    const images = normalized.images;

    const itemMap = new Map(items.map((item) => [item.id, item]));
    const questMap = new Map(quests.map((quest) => [quest.id, quest]));

    items.forEach((item) => assertEntityHasId(item, 'item'));
    processes.forEach((process) => assertEntityHasId(process, 'process'));
    quests.forEach((quest) => assertEntityHasId(quest, 'quest'));

    images.forEach((image) => {
        if (!image || typeof image !== 'object') {
            throw new Error('Invalid image record in backup.');
        }
        if (!image.entityId || !image.entityType) {
            throw new Error('Invalid image record in backup.');
        }
        if (typeof image.dataUrl !== 'string' || !isValidImageDataUrl(image.dataUrl)) {
            throw new Error('Invalid image data in backup.');
        }

        if (image.entityType === 'item') {
            const item = itemMap.get(image.entityId);
            if (!item) {
                throw new Error(`Missing item for image ${image.entityId}.`);
            }
            item.image = image.dataUrl;
        } else if (image.entityType === 'quest') {
            const quest = questMap.get(image.entityId);
            if (!quest) {
                throw new Error(`Missing quest for image ${image.entityId}.`);
            }
            quest.image = image.dataUrl;
        } else {
            throw new Error('Invalid image record in backup.');
        }
    });

    await assertNoImportConflicts(items, processes, quests);

    const plan = buildImportPlan(items, processes, quests, images);
    emitProgress(onProgress, { type: 'plan', assets: plan });

    for (const asset of plan) {
        try {
            if (asset.kind === 'image') {
                // Images are already applied during validation.
            } else if (asset.kind === 'item') {
                await db.items.add(asset.entity);
            } else if (asset.kind === 'process') {
                await db.processes.add(asset.entity);
            } else if (asset.kind === 'quest') {
                await db.quests.add(asset.entity);
            }
            emitProgress(onProgress, { type: 'asset', assetId: asset.id });
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            emitProgress(onProgress, { type: 'error', assetId: asset.id, error: message });
            throw new Error(`Failed to import ${asset.label}: ${message}`);
        }
    }

    return {
        items: items.length,
        processes: processes.length,
        quests: quests.length,
        images: images.length,
    };
}

export async function restoreCustomContentBackupFromFile(file, options = {}) {
    if (!(file instanceof File)) {
        throw new Error('Invalid backup file.');
    }

    if (file.size > MAX_BACKUP_FILE_SIZE) {
        throw new Error('Backup file is too large. Maximum size is 50MB.');
    }

    const text = await file.text();
    let parsed;

    try {
        parsed = JSON.parse(text);
    } catch (error) {
        throw new Error('Invalid backup file.');
    }

    return await restoreCustomContentBackup(parsed, options);
}
