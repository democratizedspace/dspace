import { describe, it, expect } from 'vitest';
import createDOMPurify from '../frontend/node_modules/dompurify/dist/purify.cjs';

const DOMPurify = createDOMPurify(window as any);

describe('DOMPurify', () => {
    it('removes unsafe attributes and tags', () => {
        const dirty = '<img src="x" onerror="alert(1)"><script>alert(1)</script>';
        const clean = DOMPurify.sanitize(dirty);
        expect(clean).not.toMatch(/script/);
        expect(clean).not.toMatch(/onerror/);
    });
});
