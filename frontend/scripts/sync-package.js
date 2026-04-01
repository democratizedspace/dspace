import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_METADATA_KEYS = Object.freeze(['name', 'version', 'description', 'license']);

const formatJson = (data) => `${JSON.stringify(data, null, 4)}\n`;

const readJson = (filePath) => JSON.parse(readFileSync(filePath, 'utf8'));

const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function syncPackageMetadata({
    rootPackagePath = path.resolve(process.cwd(), '..', 'package.json'),
    targetPackagePath = path.resolve(process.cwd(), 'package.json'),
    metadataKeys = DEFAULT_METADATA_KEYS,
    logger = console,
} = {}) {
    const rootPackage = readJson(rootPackagePath);
    const targetPackage = readJson(targetPackagePath);
    const updatedPackage = { ...targetPackage };

    const changedKeys = metadataKeys.reduce((acc, key) => {
        if (!(key in rootPackage)) {
            return acc;
        }

        if (!isEqual(rootPackage[key], targetPackage[key])) {
            updatedPackage[key] = rootPackage[key];
            acc.push(key);
        }

        return acc;
    }, []);

    if (changedKeys.length > 0) {
        writeFileSync(targetPackagePath, formatJson(updatedPackage));
        logger.log(`Synced package metadata fields: ${changedKeys.join(', ')}`);
    } else {
        logger.log('Package metadata already synchronized.');
    }

    return changedKeys;
}

const isExecutedDirectly = (() => {
    if (!process.argv[1]) {
        return false;
    }

    const invokedPath = path.resolve(process.argv[1]);
    const modulePath = fileURLToPath(import.meta.url);

    return invokedPath === modulePath;
})();

if (isExecutedDirectly) {
    syncPackageMetadata();
}
