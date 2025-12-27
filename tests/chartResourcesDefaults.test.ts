import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';

describe('Helm chart resource defaults', () => {
    it('ships tuned resource requests and limits instead of placeholders', () => {
        const valuesPath = join(process.cwd(), 'charts', 'dspace', 'values.yaml');
        const values = parse(readFileSync(valuesPath, 'utf8')) as {
            resources?: {
                requests?: { cpu?: string; memory?: string };
                limits?: { cpu?: string; memory?: string };
            };
        };

        expect(values.resources).toBeDefined();
        expect(values.resources?.requests).toMatchObject({
            cpu: '500m',
            memory: '768Mi',
        });
        expect(values.resources?.limits).toMatchObject({
            cpu: '1',
            memory: '1536Mi',
        });

        const chartsDoc = readFileSync(join(process.cwd(), 'docs', 'charts.md'), 'utf8');
        expect(chartsDoc).toMatch(/`?500m`?[^\n]+`?768Mi`?/i);
        expect(chartsDoc).toMatch(/`?1`?\s*CPU[^\n]+`?1536Mi`?/i);
    });
});
