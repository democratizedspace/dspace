import { describe, expect, it, vi } from 'vitest';

vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn().mockReturnValue(true),
    },
}));

describe('run-test-groups configuration', () => {
    it('includes an integration batch that includes custom content flow sequentially', async () => {
        const { TEST_GROUPS } = await import('../frontend/scripts/run-test-groups.mjs');
        const integrationGroup = TEST_GROUPS.find((group) => group.name === 'Integration Tests');

        expect(integrationGroup).toBeDefined();
        expect(integrationGroup?.files).toContain('custom-content.spec.ts');
        expect(integrationGroup?.grep).toMatch(/integrate custom items, processes, and quests/);
        expect(integrationGroup?.parallel).toBe(false);
    });
});
