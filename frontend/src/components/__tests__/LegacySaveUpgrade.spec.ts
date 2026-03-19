import { render, fireEvent, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import LegacySaveUpgrade from '../svelte/LegacySaveUpgrade.svelte';

const importV1V3Mock = vi.fn(async () => ({}));
const inspectGameStateStorageMock = vi.fn(async () => ({
    indexedDbState: null,
    localStorageState: null,
    indexedDbSupported: true,
    usesLocalStorageFallback: false,
    legacyV2State: null,
    hasLegacyV2Keys: false,
    legacyV2ParseIssues: [],
}));

vi.mock('../../utils/gameState.js', async () => {
    const actual = await vi.importActual('../../utils/gameState.js');
    return {
        ...actual,
        importV1V3: (...args: unknown[]) => importV1V3Mock(...args),
        importV2V3: vi.fn(async () => null),
        mergeLegacyStateIntoCurrent: vi.fn(async () => null),
    };
});

vi.mock('../../utils/gameState/common.js', () => ({
    inspectGameStateStorage: (...args: unknown[]) => inspectGameStateStorageMock(...args),
    isUsingLocalStorage: () => false,
}));

vi.mock('../../utils/legacySaveDetection', () => ({
    detectLegacyArtifacts: () => ({
        hasV1Cookies: true,
        hasV2LocalStorage: false,
        v1Items: [{ id: '58580f6f-f3be-4be0-80b9-f6f8bf0b05a6', count: 2 }],
        v1CookieKeys: ['item-3'],
        v1InvalidItems: [],
        v1CurrencyBalances: [],
        v1CurrencyIssues: [],
    }),
}));

vi.mock('../../lib/qaCheats', () => ({
    qaCheatsEnabled: {
        subscribe: (cb: (value: boolean) => void) => {
            cb(false);
            return () => {};
        },
    },
}));

describe('LegacySaveUpgrade', () => {
    beforeEach(() => {
        importV1V3Mock.mockClear();
        inspectGameStateStorageMock.mockClear();
        document.cookie = 'item-3=2; path=/';
    });

    test('merge v1 action imports and expires v1 cookies', async () => {
        render(LegacySaveUpgrade, {
            props: {
                legacyV1Items: [{ id: '58580f6f-f3be-4be0-80b9-f6f8bf0b05a6', count: 2 }],
                legacyCookieKeys: ['item-3'],
                cheatsAvailable: false,
            },
        });

        const mergeButton = await screen.findByRole('button', {
            name: 'Merge v1 into current save',
        });
        await fireEvent.click(mergeButton);

        await waitFor(() => {
            expect(importV1V3Mock).toHaveBeenCalledWith(
                [{ id: '58580f6f-f3be-4be0-80b9-f6f8bf0b05a6', count: 2 }],
                expect.objectContaining({ replaceExisting: false, grantUpgradeTrophy: true })
            );
            expect(screen.getByText('Merged v1 items into your current save.')).toBeTruthy();
            expect(document.cookie).not.toContain('item-3=');
        });
    });
});
