import { db, ENTITY_TYPES } from '../../utils/customcontent.js';

export const CUSTOM_CONTENT_BACKUP_VERSION = 1;
const BACKUP_FILE_PREFIX = 'dspace-custom-content-backup';

const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0));

const formatNumber = (value) => String(value).padStart(2, '0');

const formatTimestamp = (date = new Date()) => {
    const year = date.getFullYear();
    const month = formatNumber(date.getMonth() + 1);
    const day = formatNumber(date.getDate());
    const hours = formatNumber(date.getHours());
    const minutes = formatNumber(date.getMinutes());
    const seconds = formatNumber(date.getSeconds());
    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
};

export const formatBackupFilename = (date = new Date()) =>
    `${BACKUP_FILE_PREFIX}-${formatTimestamp(date)}.json`;

const describeLabel = (prefix, name, fallbackId) =>
    name ? `${prefix}: ${name}` : `${prefix}: ${fallbackId}`;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export const buildCustomContentAssets = ({ items = [], processes = [], quests = [] }) => {
    const assets = [];

    items.forEach((item) => {
        assets.push({
            key: `item:${item.id}`,
            label: describeLabel('Item', item.name, item.id),
            progress: 0,
        });

        if (isNonEmptyString(item.image)) {
            assets.push({
                key: `item-image:${item.id}`,
                label: describeLabel('Item image', item.name, item.id),
                progress: 0,
            });
        }
    });

    processes.forEach((process) => {
        assets.push({
            key: `process:${process.id}`,
            label: describeLabel('Process', process.title, process.id),
            progress: 0,
        });
    });

    quests.forEach((quest) => {
        assets.push({
            key: `quest:${quest.id}`,
            label: describeLabel('Quest', quest.title, quest.id),
            progress: 0,
        });

        if (isNonEmptyString(quest.image)) {
            assets.push({
                key: `quest-image:${quest.id}`,
                label: describeLabel('Quest image', quest.title, quest.id),
                progress: 0,
            });
        }

        if (isNonEmptyString(quest.npc)) {
            assets.push({
                key: `quest-npc:${quest.id}`,
                label: describeLabel('Quest NPC image', quest.title, quest.id),
                progress: 0,
            });
        }
    });

    return assets;
};

export const buildCustomContentBackupPayload = ({ items, processes, quests }) => {
    const exportedAt = new Date().toISOString();
    const assets = buildCustomContentAssets({ items, processes, quests });

    return {
        schemaVersion: CUSTOM_CONTENT_BACKUP_VERSION,
        exportedAt,
        counts: {
            items: items.length,
            processes: processes.length,
            quests: quests.length,
            images: assets.filter(
                (asset) => asset.key.includes('-image') || asset.key.includes('npc')
            ).length,
        },
        data: {
            items,
            processes,
            quests,
        },
    };
};

const updateAssetProgress = (assets, assetIndex, key, progress) => {
    const index = assetIndex.get(key);
    if (index === undefined) {
        return assets;
    }
    const updated = assets.map((asset, i) =>
        i === index ? { ...asset, progress } : asset
    );
    return updated;
};

const runAssetProgress = async (assets, onProgress) => {
    if (typeof onProgress !== 'function' || assets.length === 0) {
        return assets;
    }

    let updatedAssets = assets.map((asset) => ({ ...asset }));
    const assetIndex = new Map(updatedAssets.map((asset, index) => [asset.key, index]));

    onProgress(updatedAssets);

    for (const asset of updatedAssets) {
        updatedAssets = updateAssetProgress(updatedAssets, assetIndex, asset.key, 100);
        onProgress(updatedAssets);
        await yieldToBrowser();
    }

    return updatedAssets;
};

export const prepareCustomContentBackup = async ({ onProgress } = {}) => {
    const [items, processes, quests] = await Promise.all([
        db.list(ENTITY_TYPES.ITEM),
        db.list(ENTITY_TYPES.PROCESS),
        db.list(ENTITY_TYPES.QUEST),
    ]);

    const assets = buildCustomContentAssets({ items, processes, quests });
    const processedAssets = await runAssetProgress(assets, onProgress);
    const payload = buildCustomContentBackupPayload({ items, processes, quests });

    return {
        blob: new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
        filename: formatBackupFilename(new Date(payload.exportedAt)),
        assets: processedAssets,
    };
};

const ensureArray = (value, name) => {
    if (value === undefined) {
        return [];
    }
    if (Array.isArray(value)) {
        return value;
    }
    throw new Error(`Backup data is missing a valid ${name} list.`);
};

export const parseCustomContentBackupPayload = (text) => {
    let parsed;
    try {
        parsed = JSON.parse(text);
    } catch (error) {
        throw new Error('Backup file is not valid JSON.');
    }

    if (parsed?.schemaVersion !== CUSTOM_CONTENT_BACKUP_VERSION) {
        throw new Error('Unsupported custom content backup schema version.');
    }

    if (!parsed?.data || typeof parsed.data !== 'object') {
        throw new Error('Backup file is missing custom content data.');
    }

    const items = ensureArray(parsed.data.items, 'items');
    const processes = ensureArray(parsed.data.processes, 'processes');
    const quests = ensureArray(parsed.data.quests, 'quests');

    return {
        manifest: {
            exportedAt: parsed.exportedAt,
            counts: parsed.counts,
        },
        data: {
            items,
            processes,
            quests,
        },
    };
};

const buildImportSteps = ({ items, processes, quests }) => {
    const steps = [];

    items.forEach((item) => {
        steps.push({
            key: `item:${item.id}`,
            action: () => db.items.add(item),
        });
        if (isNonEmptyString(item.image)) {
            steps.push({ key: `item-image:${item.id}` });
        }
    });

    processes.forEach((process) => {
        steps.push({
            key: `process:${process.id}`,
            action: () => db.processes.add(process),
        });
    });

    quests.forEach((quest) => {
        steps.push({
            key: `quest:${quest.id}`,
            action: () => db.quests.add(quest),
        });
        if (isNonEmptyString(quest.image)) {
            steps.push({ key: `quest-image:${quest.id}` });
        }
        if (isNonEmptyString(quest.npc)) {
            steps.push({ key: `quest-npc:${quest.id}` });
        }
    });

    return steps;
};

export const importCustomContentBackupFile = async (file, { onProgress } = {}) => {
    const text = await file.text();
    const { data } = parseCustomContentBackupPayload(text);
    const assets = buildCustomContentAssets(data);
    let updatedAssets = assets.map((asset) => ({ ...asset }));
    const assetIndex = new Map(updatedAssets.map((asset, index) => [asset.key, index]));

    if (typeof onProgress === 'function') {
        onProgress(updatedAssets);
    }

    const steps = buildImportSteps(data);

    for (const step of steps) {
        if (step.action) {
            try {
                await step.action();
            } catch (error) {
                const asset = updatedAssets[assetIndex.get(step.key)];
                const label = asset?.label ?? step.key;
                throw new Error(`Failed to import ${label}.`);
            }
        }
        updatedAssets = updateAssetProgress(updatedAssets, assetIndex, step.key, 100);
        if (typeof onProgress === 'function') {
            onProgress(updatedAssets);
        }
        await yieldToBrowser();
    }

    return {
        assets: updatedAssets,
        counts: {
            items: data.items.length,
            processes: data.processes.length,
            quests: data.quests.length,
        },
    };
};
