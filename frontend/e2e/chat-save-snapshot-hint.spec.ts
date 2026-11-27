import { expect, test } from '@playwright/test';

test('offers the save-snapshot hint for progress questions and remembers dismissal', async ({
    page,
}) => {
    await page.goto('/chat');
    const panel = page.getByTestId('chat-panel');
    await expect(panel).toHaveAttribute('data-hydrated', 'true');

    const composer = panel.getByRole('textbox', { name: 'Chat message' });
    const hint = panel.getByRole('note').filter({ hasText: 'export/paste a save snapshot' });
    await expect(hint).toHaveCount(0);

    await composer.fill('How do solar panels work?');
    await expect(hint).toHaveCount(0);

    await composer.fill('How much progress have I made?');
    await expect(hint).toContainText('/gamesaves');
    await expect(hint).toBeVisible();

    await hint.getByRole('button', { name: 'Dismiss save snapshot hint' }).click();
    await expect(hint).toHaveCount(0);

    await page.reload();
    await expect(panel).toHaveAttribute('data-hydrated', 'true');
    await composer.fill('What is in my inventory?');
    await expect(hint).toHaveCount(0);
});
