import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const CHUNKS_PATH = path.join(repoRoot, 'frontend/src/generated/rag/docs_chunks.json');

const anchorPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const main = async () => {
    const raw = await fs.readFile(CHUNKS_PATH, 'utf-8');
    const chunks = JSON.parse(raw);

    if (!Array.isArray(chunks) || chunks.length === 0) {
        throw new Error('RAG chunks output is empty.');
    }

    const kinds = new Set(chunks.map((chunk) => chunk.kind));
    if (!kinds.has('doc') || !kinds.has('route') || !kinds.has('changelog')) {
        throw new Error(
            `Expected doc, route, and changelog chunks; saw: ${[...kinds].join(', ')}`
        );
    }

    const hasV3Changelog = chunks.some((chunk) =>
        String(chunk.path).includes(
            'frontend/src/pages/docs/md/changelog/20260301.md'
        )
    );
    if (!hasV3Changelog) {
        throw new Error('Missing v3 release notes chunk (20260301.md).');
    }

    for (const chunk of chunks) {
        if (!chunk.text || !chunk.text.trim()) {
            throw new Error(`Chunk ${chunk.id} has empty text.`);
        }
        if (!chunk.slug || !String(chunk.slug).trim()) {
            throw new Error(`Chunk ${chunk.id} has empty slug.`);
        }
        if (!chunk.anchor || !anchorPattern.test(String(chunk.anchor))) {
            throw new Error(`Chunk ${chunk.id} has invalid anchor: ${chunk.anchor}`);
        }
    }

    console.log(`Docs RAG chunks look good (${chunks.length} chunks).`);
};

main().catch((error) => {
    console.error('Docs RAG smoke test failed:', error);
    process.exitCode = 1;
});
