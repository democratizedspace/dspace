import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/svelte';
import { expect, it, vi } from 'vitest';
import Importer from '../svelte/Importer.svelte';
vi.mock('../../../utils/indexeddb.js', () => ({
    initializeCustomContentForImportUI: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../utils/gameState/common.js', () => ({
    importGameStateString: vi.fn().mockRejectedValue({
        code: 'fallback-reload-required',
        message: 'Reload to reconcile saved progress before retrying this operation.',
    }),
    recoverImportGameState: vi.fn(),
    getImportRecoveryStatus: vi.fn().mockReturnValue(null),
}));
it('shows reload guidance for a combined backup blocked by fallback mode', async () => {
    const { getByRole, findByText } = render(Importer);
    await fireEvent.input(getByRole('textbox'), { target: { value: 'synthetic-backup' } });
    await fireEvent.click(getByRole('button', { name: /^Import$/ }));
    expect(
        await findByText('Reload to reconcile saved progress before retrying this operation.')
    ).toBeInTheDocument();
});
