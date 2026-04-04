import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import prettier from 'prettier';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const questsRoot = path.join(root, 'src/pages/quests/json');
const outputPath = path.join(root, 'src/generated/quests/listManifest.json');

const normalizeRequiresQuests = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter((entry) => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
};

const normalizeQuestSummary = (questPath, questData) => {
    const relativePath = path.relative(questsRoot, questPath).replace(/\\/g, '/');
    const [tree, fileName] = relativePath.split('/');
    const slug = fileName.replace(/\.json$/i, '');
    const id = typeof questData?.id === 'string' ? questData.id.trim() : '';

    if (!id || !tree || !slug) {
        return null;
    }

    return {
        id,
        title: typeof questData.title === 'string' ? questData.title.trim() : id,
        description: typeof questData.description === 'string' ? questData.description.trim() : '',
        image: typeof questData.image === 'string' ? questData.image.trim() : '',
        requiresQuests: normalizeRequiresQuests(questData.requiresQuests),
        tree,
        slug,
        route: `/quests/${id}`,
        sourcePath: `./json/${tree}/${slug}.json`,
    };
};

export const buildQuestListManifest = () => {
    const treeEntries = fs
        .readdirSync(questsRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));

    const summaries = [];

    for (const tree of treeEntries) {
        const treeDir = path.join(questsRoot, tree);
        const questFiles = fs
            .readdirSync(treeDir, { withFileTypes: true })
            .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
            .map((entry) => entry.name)
            .sort((a, b) => a.localeCompare(b));

        for (const questFile of questFiles) {
            const questPath = path.join(treeDir, questFile);
            const questData = JSON.parse(fs.readFileSync(questPath, 'utf8'));
            const summary = normalizeQuestSummary(questPath, questData);
            if (summary) {
                summaries.push(summary);
            }
        }
    }

    return summaries.sort((a, b) => a.id.localeCompare(b.id));
};

const manifest = buildQuestListManifest();
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
const manifestJson = JSON.stringify(manifest);
const prettierConfig = (await prettier.resolveConfig(outputPath)) || {};
const formattedManifest = await prettier.format(manifestJson, {
    ...prettierConfig,
    parser: 'json',
});
fs.writeFileSync(outputPath, formattedManifest);
