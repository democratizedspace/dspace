import { describe, expect, test } from 'vitest';

import { getItemMetadata } from '../svelte/compactItemListHelpers.js';

describe('compactItemListHelpers', () => {
    test('ignores untrusted entry image values for unknown items', () => {
        const metadata = getItemMetadata(
            {
                id: 'custom-item',
                name: 'Custom item',
                image: 'data:image/svg+xml,<svg onload=alert(1)/>',
            },
            new Map()
        );

        expect(metadata.image).toBe('/favicon.ico');
    });
});
