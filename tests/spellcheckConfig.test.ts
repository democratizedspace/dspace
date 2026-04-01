import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('cspell configuration', () => {
    const rootDir = path.resolve(__dirname, '..');
    const configPath = path.join(rootDir, '.cspell.json');
    const dictionaryPath = path.join(rootDir, 'cspell', 'dspace-terms.txt');

    it('exists with the shared dictionary definition and ignores noisy paths', () => {
        expect(fs.existsSync(configPath)).toBe(true);
        expect(fs.existsSync(dictionaryPath)).toBe(true);

        const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
            dictionaryDefinitions?: Array<{ name?: string; path?: string }>;
            ignorePaths?: string[];
            dictionaries?: string[];
        };

        const dictionaries = config.dictionaryDefinitions ?? [];
        const dspaceDictionary = dictionaries.find((entry) => entry.name === 'dspace-terms');

        expect(dspaceDictionary?.path).toBe('./cspell/dspace-terms.txt');
        expect(config.dictionaries).toContain('dspace-terms');

        const ignores = config.ignorePaths ?? [];
        expect(ignores).toContain('frontend/src/pages/**/json/**');
        expect(ignores).toContain('frontend/src/pages/processes/processes.json');
    });
});
