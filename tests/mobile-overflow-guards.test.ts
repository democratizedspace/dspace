import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';

type FormGuard = {
    name: string;
    sourcePath: string;
};

const forms: FormGuard[] = [
    {
        name: 'ProcessForm',
        sourcePath: 'frontend/src/components/svelte/ProcessForm.svelte',
    },
    {
        name: 'ItemForm',
        sourcePath: 'frontend/src/components/svelte/ItemForm.svelte',
    },
    {
        name: 'QuestForm',
        sourcePath: 'frontend/src/components/svelte/QuestForm.svelte',
    },
];

describe('mobile overflow guards for custom-content forms', () => {
    forms.forEach(({ name, sourcePath }) => {
        it(`${name} keeps container width and box sizing bounded`, () => {
            const source = readFileSync(sourcePath, 'utf8');

            expect(source).toMatch(/\.process-form|\.item-form|\.quest-form/);
            expect(source).toMatch(/width:\s*100%/);
            expect(source).toMatch(/box-sizing:\s*border-box/);
        });

        it(`${name} bounds text inputs to container width`, () => {
            const source = readFileSync(sourcePath, 'utf8');

            expect(source).toMatch(/input[\s\S]*box-sizing:\s*border-box/);
            expect(source).toMatch(/max-width:\s*100%/);
        });
    });

    it('ProcessForm avoids narrow-screen overflow-prone text width', () => {
        const source = readFileSync('frontend/src/components/svelte/ProcessForm.svelte', 'utf8');

        expect(source).not.toMatch(/input\[type='text'\]\s*{[\s\S]*width:\s*85%/);
    });
});
