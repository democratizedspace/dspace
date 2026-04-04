import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const questsRoot = path.join(root, 'src/pages/quests/json');
const outputPath = path.join(root, 'src/generated/quests/listManifest.json');

const REQUIRED_STRING = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeRequires = (value) =>
    Array.from(
        new Set(
            (Array.isArray(value) ? value : [])
                .filter((entry) => typeof entry === 'string')
                .map((entry) => entry.trim())
                .filter(Boolean)
        )
    ).sort((a, b) => a.localeCompare(b));

const collectQuestFiles = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const nested = entries
        .filter((entry) => entry.isDirectory())
        .flatMap((entry) => collectQuestFiles(path.join(dir, entry.name)));
    const files = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
        .map((entry) => path.join(dir, entry.name));
    return [...nested, ...files];
};

const files = collectQuestFiles(questsRoot).sort((a, b) => a.localeCompare(b));

const manifest = files
    .map((filePath) => {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const relative = path.relative(questsRoot, filePath);
        const [tree = '', filename = ''] = relative.split(path.sep);
        const slug = filename.replace(/\.json$/u, '');
        const id = REQUIRED_STRING(parsed?.id);
        if (!id) {
            return null;
        }

        return {
            id,
            title: REQUIRED_STRING(parsed?.title),
            description: REQUIRED_STRING(parsed?.description),
            image: REQUIRED_STRING(parsed?.image),
            tree,
            slug,
            route: `/quests/${id}`,
            requiresQuests: normalizeRequires(parsed?.requiresQuests),
        };
    })
    .filter(Boolean)
    .sort((a, b) => a.id.localeCompare(b.id));

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 4) + '\n', 'utf8');
