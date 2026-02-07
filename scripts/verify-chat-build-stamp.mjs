import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertBuildMetaComplete, readBuildMeta } from './write-build-meta.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = process.env.VERIFY_REPO_ROOT
    ? path.resolve(process.env.VERIFY_REPO_ROOT)
    : path.resolve(__dirname, '..');
const buildMetaPath = path.join(repoRoot, 'frontend', 'src', 'generated', 'build_meta.json');

const candidateDirs = [
    path.join(repoRoot, 'frontend', 'dist'),
    path.join(repoRoot, 'frontend', '.vercel', 'output', 'static'),
    path.join(repoRoot, 'frontend', '.vercel', 'output'),
    path.join(repoRoot, 'dist'),
];

const allowedExtensions = new Set(['.js', '.mjs', '.cjs', '.html', '.css', '.map']);

const normalizeSha = (value) => String(value || '').trim();

const walkFiles = async (dir, results = []) => {
    let entries = [];
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (error) {
        return results;
    }
    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            await walkFiles(entryPath, results);
        } else if (entry.isFile()) {
            results.push(entryPath);
        }
    }
    return results;
};

const findBuildDir = async () => {
    for (const dir of candidateDirs) {
        try {
            const entries = await fs.readdir(dir);
            if (entries.length > 0) {
                return dir;
            }
        } catch (error) {
            continue;
        }
    }
    return null;
};

const searchFileForNeedles = async (filePath, needles) => {
    const matches = new Set();
    const maxNeedleLength = Math.max(...needles.map((needle) => needle.length));
    let carryover = '';

    await new Promise((resolve, reject) => {
        const stream = createReadStream(filePath);
        stream.on('data', (chunk) => {
            const text = carryover + chunk.toString('utf8');
            for (const needle of needles) {
                if (text.includes(needle)) {
                    matches.add(needle);
                }
            }
            carryover = text.slice(-maxNeedleLength);
        });
        stream.on('error', reject);
        stream.on('end', resolve);
    });

    return matches;
};

const scanAssets = async () => {
    const buildDir = await findBuildDir();
    if (!buildDir) {
        throw new Error(
            `No frontend build output found. Checked: ${candidateDirs.join(', ')}`
        );
    }

    let buildMeta;
    let gitSha = '';
    try {
        buildMeta = await readBuildMeta();
        gitSha = normalizeSha(buildMeta?.gitSha);
        assertBuildMetaComplete(buildMeta);
    } catch (error) {
        const errorDetails = String(error?.stack ?? error?.message ?? error);
        throw new Error(
            [
                'Chat build stamp verification failed.',
                'Gate A failed: build_meta.json is invalid.',
                `buildDir: ${buildDir}`,
                `buildMetaPath: ${buildMetaPath}`,
                `expectedSha: ${gitSha || '(missing)'}`,
                errorDetails,
            ]
                .filter(Boolean)
                .join('\n')
        );
    }

    const shortSha = gitSha.length > 7 ? gitSha.slice(0, 7) : gitSha;
    const promptLabel = `v3:${shortSha}`;
    const gitShaJsonNeedles = [`"gitSha":"${gitSha}"`, `"gitSha": "${gitSha}"`];

    const files = await walkFiles(buildDir);
    const assetFiles = files.filter((file) => allowedExtensions.has(path.extname(file)));

    if (assetFiles.length === 0) {
        throw new Error(
            `No build assets found in ${buildDir}. buildMetaPath: ${buildMetaPath}. gitSha: ${gitSha}`
        );
    }

    const mustFind = [gitSha];
    const mustNotFind = ['v3:missing'];
    const optionalFind = [promptLabel, 'Prompt version: v3:'];
    const allNeedles = [...mustFind, ...mustNotFind, ...optionalFind, ...gitShaJsonNeedles];
    const foundMustFind = new Set();
    const foundOptional = new Set();
    const forbiddenHits = new Map(mustNotFind.map((needle) => [needle, new Set()]));
    let foundGitShaJson = false;

    for (const filePath of assetFiles) {
        let matches = new Set();
        try {
            matches = await searchFileForNeedles(filePath, allNeedles);
        } catch (error) {
            continue;
        }

        for (const needle of mustFind) {
            if (matches.has(needle)) {
                foundMustFind.add(needle);
            }
        }
        for (const needle of optionalFind) {
            if (matches.has(needle)) {
                foundOptional.add(needle);
            }
        }
        for (const needle of mustNotFind) {
            if (matches.has(needle)) {
                forbiddenHits.get(needle)?.add(filePath);
            }
        }
        if (gitShaJsonNeedles.some((needle) => matches.has(needle))) {
            foundGitShaJson = true;
        }
    }

    const failureMessages = [];
    if (!foundMustFind.has(gitSha)) {
        failureMessages.push(
            `Gate B failed: missing full git SHA ${gitSha} in assets.`
        );
    }

    const forbiddenFiles = Array.from(forbiddenHits.entries())
        .filter(([, files]) => files.size > 0)
        .flatMap(([needle, files]) =>
            Array.from(files).map((file) => ({ needle, file }))
        );
    if (forbiddenFiles.length > 0) {
        const forbiddenNeedles = Array.from(
            new Set(forbiddenFiles.map(({ needle }) => needle))
        ).join(', ');
        failureMessages.push(
            `Gate C failed: build assets contain forbidden needle(s): ${forbiddenNeedles}.`
        );
    }

    if (failureMessages.length > 0) {
        const maxForbidden = 5;
        const forbiddenList = forbiddenFiles
            .slice(0, maxForbidden)
            .map(({ needle, file }) => `${needle} → ${file}`)
            .join('\n');
        const extraForbidden =
            forbiddenFiles.length > maxForbidden
                ? `\n...and ${forbiddenFiles.length - maxForbidden} more`
                : '';
        throw new Error(
            [
                'Chat build stamp verification failed.',
                `buildDir: ${buildDir}`,
                `buildMetaPath: ${buildMetaPath}`,
                `expectedSha: ${gitSha}`,
                ...failureMessages,
                forbiddenList ? `Forbidden needle hits:\n${forbiddenList}${extraForbidden}` : null,
            ]
                .filter(Boolean)
                .join('\n')
        );
    }

    const optionalMarkers = new Set(foundOptional);
    if (foundGitShaJson) {
        optionalMarkers.add('build_meta.gitSha JSON');
    }

    if (optionalMarkers.size > 0) {
        console.warn(`Optional markers found: ${Array.from(optionalMarkers).join(', ')}`);
    } else {
        console.warn(
            `Optional markers not found (searched: ${[...optionalFind, ...gitShaJsonNeedles].join(
                ', '
            )}). Non-fatal.`
        );
    }
};

scanAssets().catch((error) => {
    console.error(String(error?.stack ?? error?.message ?? error));
    process.exit(1);
});
