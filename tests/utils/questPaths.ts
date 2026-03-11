import { promises as fs } from 'node:fs';
import path from 'node:path';

const QUESTS_DIR = path.join(process.cwd(), 'frontend/src/pages/quests/json');

export const listQuestJsonFiles = async (baseDir = QUESTS_DIR): Promise<string[]> => {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const fullPath = path.join(baseDir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await listQuestJsonFiles(fullPath)));
            continue;
        }

        if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
        files.push(path.relative(QUESTS_DIR, fullPath));
    }

    return files.sort();
};

export const loadQuestPaths = async (baseDir = QUESTS_DIR) => {
    const paths = new Map<string, string>();

    for (const relativePath of await listQuestJsonFiles(baseDir)) {
        const fullPath = path.join(QUESTS_DIR, relativePath);
        const raw = await fs.readFile(fullPath, 'utf8');
        const quest = JSON.parse(raw);
        if (quest?.id) {
            paths.set(quest.id, path.relative(process.cwd(), fullPath));
        }
    }

    return paths;
};
