import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format } from 'prettier';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const questsDir = path.join(root, 'src/pages/quests/json');
const outPath = path.join(root, 'src/generated/quests/listManifest.json');

const findQuestFiles = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...findQuestFiles(fullPath));
            continue;
        }

        if (entry.isFile() && entry.name.endsWith('.json')) {
            files.push(fullPath);
        }
    }

    return files;
};

const normalizeRequiresQuests = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    const deduped = new Set();
    value.forEach((questId) => {
        if (typeof questId !== 'string') {
            return;
        }
        const normalized = questId.trim();
        if (normalized) {
            deduped.add(normalized);
        }
    });

    return Array.from(deduped).sort((left, right) => left.localeCompare(right));
};

const questFiles = findQuestFiles(questsDir);
const manifest = questFiles
    .map((file) => {
        const relativePath = path.relative(questsDir, file).replace(/\\/g, '/');
        const [tree] = relativePath.split('/');
        const slug = relativePath.replace(/\.json$/, '');
        const route = `/quests/${slug}`;
        const raw = JSON.parse(fs.readFileSync(file, 'utf8'));

        return {
            id: typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : slug,
            title: typeof raw.title === 'string' ? raw.title : '',
            description: typeof raw.description === 'string' ? raw.description : '',
            image: typeof raw.image === 'string' ? raw.image : '/assets/quests/howtodoquests.jpg',
            requiresQuests: normalizeRequiresQuests(raw.requiresQuests),
            tree,
            slug,
            route,
            sourcePath: `./json/${relativePath}`,
        };
    })
    .sort((left, right) => {
        if (left.tree !== right.tree) {
            return left.tree.localeCompare(right.tree);
        }
        if (left.slug !== right.slug) {
            return left.slug.localeCompare(right.slug);
        }
        return left.id.localeCompare(right.id);
    });

fs.mkdirSync(path.dirname(outPath), { recursive: true });
const formattedManifest = await format(JSON.stringify(manifest), {
    parser: 'json',
    filepath: outPath,
});
fs.writeFileSync(outPath, formattedManifest);
