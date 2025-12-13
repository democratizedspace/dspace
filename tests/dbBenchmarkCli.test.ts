import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);

describe('db-benchmark CLI', () => {
    it('accepts --count option', async () => {
        const script = path.join(__dirname, '../frontend/scripts/db-benchmark.js');
        const { stdout } = await execFileAsync('node', [script, '--count', '5']);
        const result = JSON.parse(stdout);
        expect(result.itemCount).toBe(5);
        expect(result.processCount).toBe(5);
        expect(result.questCount).toBe(5);
    });
});
