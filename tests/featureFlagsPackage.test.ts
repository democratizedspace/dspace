import { describe, expect, it } from 'vitest';

import { parseFeatureFlags, readBooleanOverride } from '@dspace/feature-flags';

describe('@dspace/feature-flags package', () => {
    it('parses tokens and extracts overrides consistently', () => {
        const flags = parseFeatureFlags('offlineWorker.enabled=false, quest-beta , flag=value , ,');

        expect(flags.tokens).toEqual([
            'offlineWorker.enabled=false',
            'quest-beta',
            'flag=value',
        ]);

        expect(flags.overrides.get('offlineWorker.enabled')).toBe('false');
        expect(flags.overrides.get('quest-beta')).toBeUndefined();
        expect(flags.overrides.get('flag')).toBe('value');
    });

    it('interprets boolean overrides using permissive truthy and falsy tokens', () => {
        expect(readBooleanOverride('true')).toBe(true);
        expect(readBooleanOverride('ON')).toBe(true);
        expect(readBooleanOverride('enabled')).toBe(true);

        expect(readBooleanOverride('false')).toBe(false);
        expect(readBooleanOverride('OFF')).toBe(false);
        expect(readBooleanOverride('disabled')).toBe(false);

        expect(readBooleanOverride('sometimes')).toBeUndefined();
        expect(readBooleanOverride(undefined)).toBeUndefined();
        expect(readBooleanOverride('')).toBeUndefined();
        expect(readBooleanOverride(null as unknown as string)).toBeUndefined();
        expect(readBooleanOverride(0 as unknown as string)).toBeUndefined();
    });

    it('handles edge cases and malformed tokens gracefully', () => {
        expect(parseFeatureFlags('')).toEqual({ tokens: [], overrides: new Map() });
        expect(parseFeatureFlags(undefined)).toEqual({ tokens: [], overrides: new Map() });

        const edgeCases = parseFeatureFlags('=value,key=,key=val=ue');

        expect(edgeCases.tokens).toEqual(['=value', 'key=', 'key=val=ue']);
        expect(edgeCases.overrides.get('')).toBeUndefined();
        expect(edgeCases.overrides.get('key')).toBe('val=ue');
        expect(edgeCases.overrides.size).toBe(1);
    });
});
