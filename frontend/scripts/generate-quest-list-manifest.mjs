import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, '..');
const questsRoot = path.join(frontendRoot, 'src', 'pages', 'quests', 'json');
const outputDir = path.join(frontendRoot, 'src', 'generated', 'quests');
const outputPath = path.join(outputDir, 'listManifest.json');

const walk = async (dir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const sorted = [...entries].sort((a, b) => a.name.localeCompare(b.name));
    const files = [];

    for (const entry of sorted) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await walk(fullPath)));
        } else if (entry.isFile() && entry.name.endsWith('.json')) {
            files.push(fullPath);
        }
    }

    return files;
};

const normalizeRequires = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((entry) => typeof entry === 'string' && entry.trim() !== '')
        .map((entry) => entry.trim())
        .sort((a, b) => a.localeCompare(b));
};

const toManifestEntry = (quest, questPath) => {
    const relative = path.relative(questsRoot, questPath).replaceAll('\\', '/');
    const tree = relative.split('/')[0] ?? '';
    const basename = relative.replace(/\.json$/i, '');

    return {
        id: quest.id,
        title: quest.title,
        description: quest.description,
        image: quest.image,
        requiresQuests: normalizeRequires(quest.requiresQuests),
        tree,
        questPath: `./json/${relative}`,
        route: `/quests/${basename}`,
    };
};

const run = async () => {
    const questFiles = await walk(questsRoot);
    const manifest = [];

    for (const questPath of questFiles) {
        const raw = await fs.readFile(questPath, 'utf8');
        const quest = JSON.parse(raw);

        if (!quest || typeof quest !== 'object' || typeof quest.id !== 'string') {
            continue;
        }

        manifest.push(toManifestEntry(quest, questPath));
    }

    manifest.sort((a, b) => a.id.localeCompare(b.id));

    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, `${JSON.stringify(manifest, null, 4)}\n`);

    console.log(`Generated ${manifest.length} quest summaries -> ${outputPath}`);
};

run().catch((error) => {
    console.error('Failed to generate quest list manifest', error);
    process.exit(1);
});
