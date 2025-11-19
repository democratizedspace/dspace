import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const raspiDocPath = join(process.cwd(), 'docs', 'ops', 'deploy', 'raspi.md');
const raspiWorkflowPath = join(process.cwd(), '.github', 'workflows', 'deploy-to-raspi.yml');

describe('raspberry pi deployment secrets guidance', () => {
    it('documents RPI_SSH_KEY as an existing secret instead of future work', () => {
        const content = readFileSync(raspiDocPath, 'utf8');

        expect(content).not.toMatch(/will later be stored as `?RPI_SSH_KEY`?/i);
        expect(content).toMatch(/Add the following secrets/i);
        expect(content).toMatch(/RPI_SSH_KEY/);
    });

    it('aligns the deployment workflow with the documented secret', () => {
        const workflow = readFileSync(raspiWorkflowPath, 'utf8');

        expect(workflow).toMatch(/secrets\.RPI_SSH_KEY/);
        expect(workflow).toMatch(/RPI_SSH_KEY:\s*\$\{\{\s*secrets\.RPI_SSH_KEY\s*\}\}/);
    });
});
