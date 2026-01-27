import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const chunksPath = path.join(repoRoot, 'frontend/src/generated/rag/docs_chunks.json');

const anchorRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const assert = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};

const main = async () => {
    const raw = await fs.readFile(chunksPath, 'utf-8');
    const chunks = JSON.parse(raw);

    assert(Array.isArray(chunks), 'docs_chunks.json must be an array');
    assert(chunks.length > 0, 'docs_chunks.json must not be empty');

    const kinds = new Set(chunks.map((chunk) => chunk.kind));
    assert(kinds.has('doc'), 'docs_chunks.json must include doc chunks');
    assert(kinds.has('route'), 'docs_chunks.json must include route chunks');
    assert(kinds.has('changelog'), 'docs_chunks.json must include changelog chunks');

    chunks.forEach((chunk) => {
        assert(typeof chunk.text === 'string' && chunk.text.trim(), 'Chunk text must be non-empty');
        assert(typeof chunk.slug === 'string' && chunk.slug.trim(), 'Chunk slug must be non-empty');
        assert(
            typeof chunk.anchor === 'string' &&
                chunk.anchor.trim() &&
                anchorRegex.test(chunk.anchor),
            `Chunk anchor must be a stable slug: ${chunk.anchor}`
        );
    });

    console.log(`docs_chunks.json looks good (${chunks.length} chunks).`);
};

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
