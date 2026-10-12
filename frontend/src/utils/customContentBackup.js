import { getItems, getProcesses, getQuests, openCustomContentDB } from './indexeddb.js';
import { isBrowser } from './ssr.js';
import {
    prepareImport,
    prepareImportFile,
    validateCustomImportReferences,
    inspectRaster,
    IMPORT_LIMITS,
} from './importPreparation.js';
import {
    serializeManagedMutation,
    preflightCustomImport,
    validateCustomImportDestination,
    commitCustomImport,
} from './managedImportStorage.js';
import { sanitizeSaveForBackup } from '../lib/cloudsync/githubGists';

export const BACKUP_SCHEMA_VERSION = 1;

const DATA_URL_PREFIX = 'data:';
const DEFAULT_IMAGE_MIME = 'application/octet-stream';
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
    if (sanitized.image === null) delete sanitized.image;
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
            return `Item record: ${name}`;
        case 'item-image':
            return `Item image: ${name}`;
        case 'process':
            return `Process record: ${name}`;
        case 'quest':
            return `Quest record: ${name}`;
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
        if ((item?.image && item.image !== '/favicon.ico') || item?.imageBlob) {
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
        if ((quest?.image && quest.image !== '/favicon.ico') || quest?.imageBlob) {
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

async function readStoreAll(store) {
    const request = store.getAll();
    return await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed.'));
    });
}

async function readCustomContentSnapshot() {
    if (!isBrowser || typeof indexedDB === 'undefined') {
        return null;
    }

    const dbInstance = await openCustomContentDB();
    try {
        const tx = dbInstance.transaction(['items', 'processes', 'quests'], 'readonly');
        const [items, processes, quests] = await Promise.all([
            readStoreAll(tx.objectStore('items')),
            readStoreAll(tx.objectStore('processes')),
            readStoreAll(tx.objectStore('quests')),
        ]);
        return { items, processes, quests };
    } finally {
        dbInstance.close();
    }
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
    let snapshot = null;

    try {
        snapshot = await readCustomContentSnapshot();
    } catch (error) {
        snapshot = null;
    }

    const records = snapshot
        ? [snapshot.items, snapshot.processes, snapshot.quests]
        : await Promise.all([getItems(), getProcesses(), getQuests()]);
    const [items, processes, quests] = sanitizeSaveForBackup(records);
    const plan = buildBackupPlan(items, processes, quests);

    emitProgress(onProgress, {
        type: 'plan',
        assets: plan.map(({ id, kind }) => ({ id, kind, label: kind })),
    });

    const exportedItems = new Map();
    const exportedQuests = new Map();
    const exportedProcesses = [];
    const images = [];
    const imageTotals = { bytes: 0, pixels: 0 };

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
                if (images.length >= IMPORT_LIMITS.images)
                    throw new Error('Image budget exceeded.');
                const validatedDataUrl = inspectRaster(dataUrl, IMPORT_LIMITS, imageTotals);
                const target = exportedItems.get(asset.entity.id) ?? sanitizeEntity(asset.entity);
                // Image records are the single exported raster representation.
                delete target.image;
                exportedItems.set(asset.entity.id, target);
                images.push(buildImageRecord('item', asset.entity.id, validatedDataUrl));
            } else if (asset.kind === 'quest-image') {
                const dataUrl = await resolveImageData(asset.entity);
                if (!dataUrl) {
                    throw new Error('Missing quest image data.');
                }
                if (images.length >= IMPORT_LIMITS.images)
                    throw new Error('Image budget exceeded.');
                const validatedDataUrl = inspectRaster(dataUrl, IMPORT_LIMITS, imageTotals);
                const target = exportedQuests.get(asset.entity.id) ?? sanitizeEntity(asset.entity);
                // Image records are the single exported raster representation.
                delete target.image;
                exportedQuests.set(asset.entity.id, target);
                images.push(buildImageRecord('quest', asset.entity.id, validatedDataUrl));
            }

            emitProgress(onProgress, { type: 'asset', assetId: asset.id });
        } catch (error) {
            emitProgress(onProgress, { type: 'error', error: 'backup-export-failed' });
            throw new Error('Backup export failed.');
        }
    }

    const itemsArray = Array.from(exportedItems.values());
    const questsArray = Array.from(exportedQuests.values());

    const backup = sanitizeSaveForBackup({
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
    });
    prepareImport(backup, {
        kind: 'custom',
        origin: isBrowser ? window.location.origin : undefined,
    });
    return backup;
}

export async function buildCustomContentBackup({ onProgress } = {}) {
    const data = await buildCustomContentBackupData({ onProgress });
    const json = JSON.stringify(data, null, 2);
    // Whitespace counts toward the restore transport/JSON budgets too.
    prepareImport(json, { kind: 'custom', origin: isBrowser ? window.location.origin : undefined });
    const blob = new Blob([json], { type: 'application/json' });

    return {
        data,
        blob,
        filename: createBackupFilename(),
    };
}

async function restorePreparedCustomContent(plan, { onProgress, overwriteExisting = false } = {}) {
    return serializeManagedMutation(async () => {
        const { db, snapshot } = await preflightCustomImport();
        const content = plan.customContent;
        try {
            validateCustomImportReferences(content, snapshot);
            validateCustomImportDestination(content, snapshot, overwriteExisting);
            await commitCustomImport(db, content, snapshot, overwriteExisting);
        } finally {
            db.close();
        }
        // Progress only describes committed records, and contains no imported labels/values.
        if (typeof onProgress === 'function')
            onProgress({ type: 'complete', counts: content.counts });
        const { items, processes, quests, images } = content.counts;
        const total = items + processes + quests + images;
        const message =
            `${total === 0 ? 'Backup import finished with 0 entities' : 'Backup import finished'} (items=${items}, processes=${processes}, quests=${quests}, images=${images}).` +
            (content.missingSections.length
                ? ` Missing sections defaulted to empty: ${content.missingSections.join(', ')}.`
                : '');
        return { status: 'complete', ...content.counts, message };
    });
}
export async function restoreCustomContentBackup(data, options = {}) {
    const plan = prepareImport(data, {
        ...options,
        kind: 'custom',
        deferDestinationReferences: true,
        origin: isBrowser ? window.location.origin : undefined,
    });
    return restorePreparedCustomContent(plan, options);
}
export async function restoreCustomContentBackupFromFile(file, options = {}) {
    const plan = await prepareImportFile(file, {
        ...options,
        kind: 'custom',
        deferDestinationReferences: true,
        origin: isBrowser ? window.location.origin : undefined,
    });
    return restorePreparedCustomContent(plan, options);
}
