import fs from 'fs';
import path from 'path';

const componentPath = path.join(
    __dirname,
    '../frontend/src/components/svelte/CompactItemList.svelte'
);

describe('CompactItemList rendering', () => {
    it('does not hide lists when inventory counts are zero', () => {
        const content = fs.readFileSync(componentPath, 'utf8');
        expect(content).not.toMatch(/isEmpty/);
        expect(content).toMatch(/isMounted && fullItemList\.length > 0/);
    });
});
