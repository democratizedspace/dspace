import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { clearUserData, waitForHydration } from './test-helpers';

test.describe('Custom content backup', () => {
    test.beforeEach(async ({ page }) => {
        await clearUserData(page);
        await page.addInitScript(() => {
            window.__copiedBackup = null;
            const clipboard = {
                writeText: (text) => {
                    window.__copiedBackup = text;
                    const blob = new Blob([text], { type: 'application/json' });
                    const anchor = document.createElement('a');
                    anchor.download = 'custom-backup.json';
                    anchor.href = URL.createObjectURL(blob);
                    document.body.appendChild(anchor);
                    anchor.click();
                    anchor.remove();
                    return Promise.resolve();
                },
            };

            try {
                Object.defineProperty(navigator, 'clipboard', {
                    configurable: true,
                    get: () => clipboard,
                });
            } catch (error) {
                try {
                    navigator.clipboard = clipboard;
                } catch {
                    window.__stubClipboard = clipboard;
                }
            }

            window.__ensureBackupFileInput = () => {
                if (document.getElementById('custom-backup-file-input')) {
                    return;
                }

                const input = document.createElement('input');
                input.type = 'file';
                input.id = 'custom-backup-file-input';
                input.style.display = 'none';
                input.addEventListener('change', async (event) => {
                    const [file] = event.target.files || [];
                    if (!file) {
                        return;
                    }

                    const text = await file.text();
                    const target = document.querySelector('[data-testid="custom-backup-input"]');
                    if (!target) {
                        return;
                    }

                    target.value = text;
                    target.dispatchEvent(new Event('input', { bubbles: true }));
                });

                document.body.appendChild(input);
            };
        });
    });

    test('imports fixture backup and copies export string', async ({ page }) => {
        const backupPath = path.join(__dirname, 'fixtures', 'backup.json');
        const { content: backupString } = JSON.parse(await readFile(backupPath, 'utf-8'));

        await page.goto('/contentbackup');
        await waitForHydration(page);
        await page.evaluate(() => window.__ensureBackupFileInput?.());

        const exportCode = page.getByTestId('custom-backup-export');
        await expect(exportCode).toHaveText(/\S+/);
        const exportValue = (await exportCode.textContent())?.trim() ?? '';

        const [download] = await Promise.all([
            page.waitForEvent('download'),
            page.getByRole('button', { name: /^copy$/i }).click(),
        ]);
        await expect(download.suggestedFilename()).resolves.toMatch(/backup.*\.json/i);
        await expect
            .poll(async () => {
                return page.evaluate(() => window.__copiedBackup);
            })
            .toBe(exportValue);

        const importInput = page.getByTestId('custom-backup-input');
        const fileInput = page.locator('#custom-backup-file-input');
        await fileInput.setInputFiles(backupPath);
        await expect(importInput).toHaveValue(backupString);
        await page.getByRole('button', { name: /^import$/i }).click();

        await expect
            .poll(async () => {
                return page.evaluate(async () => {
                    const module = await import('/src/utils/customcontent.js');
                    const items = await module.db.list(module.ENTITY_TYPES.ITEM);
                    return items.some((item) => item.id === 'fixture-item');
                });
            })
            .toBe(true);
    });
});
