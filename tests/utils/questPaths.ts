import { promises as fs } from 'node:fs';
import path from 'node:path';

const QUESTS_DIR = path.join(process.cwd(), 'frontend/src/pages/quests/json');

export const loadQuestPaths = async (baseDir = QUESTS_DIR) => {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    const paths = new Map<string, string>();

    for (const entry of entries) {
        const fullPath = path.join(baseDir, entry.name);
        if (entry.isDirectory()) {
            const nested = await loadQuestPaths(fullPath);
            for (const [id, filePath] of nested) {
                paths.set(id, filePath);
            }
            continue;
        }

        if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
        const raw = await fs.readFile(fullPath, 'utf8');
        const quest = JSON.parse(raw);
        if (quest?.id) {
            paths.set(quest.id, path.relative(process.cwd(), fullPath));
        }
    }

    return paths;
};
