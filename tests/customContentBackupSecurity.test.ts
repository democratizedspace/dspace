import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, test } from 'vitest';
import {
  BACKUP_SCHEMA_VERSION,
  restoreCustomContentBackup,
} from '../frontend/src/utils/customContentBackup.js';

const deleteCustomContentDb = () =>
  new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('CustomContent');
    request.onerror = () => reject(request.error ?? new Error('delete failed'));
    request.onblocked = () => resolve();
    request.onsuccess = () => resolve();
  });

describe('custom content backup import security', () => {
  beforeEach(async () => {
    await deleteCustomContentDb();
  });

  test('rejects XSS-like preview text before producing an import plan', async () => {
    const progressEvents: Array<{ type: string }> = [];
    const backup = {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      timestamp: new Date().toISOString(),
      counts: { items: 1, processes: 1, quests: 1, images: 0 },
      items: [
        {
          id: 'unsafe-item',
          name: '<img src=x onerror=alert(1)>',
          description: 'unsafe item preview text',
        },
      ],
      processes: [
        {
          id: 'unsafe-process',
          title: 'Unsafe process',
          duration: '1m',
          createItems: [{ id: 'unsafe-item', count: 1 }],
        },
      ],
      quests: [
        {
          id: 'unsafe-quest',
          title: 'Unsafe quest',
          description: 'unsafe quest preview text',
          image: '/favicon.ico',
          dialogue: [
            {
              id: 'start',
              text: 'safe start',
              options: [{ type: 'finish', text: '<script>alert(1)</script>' }],
            },
          ],
        },
      ],
      images: [],
    };

    await expect(
      restoreCustomContentBackup(backup, {
        onProgress: (event: { type: string }) => progressEvents.push(event),
      })
    ).rejects.toThrow('preview-markup');

    expect(progressEvents.some((event) => event.type === 'plan')).toBe(false);
  });

  test('rejects scriptable SVG image data during import validation', async () => {
    const backup = {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      timestamp: new Date().toISOString(),
      counts: { items: 0, processes: 0, quests: 1, images: 0 },
      items: [],
      processes: [],
      quests: [
        {
          id: 'svg-quest',
          title: 'SVG Quest',
          description: 'Quest image should reject scriptable svg data URLs.',
          image: 'data:image/svg+xml,<svg onload="alert(1)"></svg>',
        },
      ],
      images: [],
    };

    await expect(restoreCustomContentBackup(backup)).rejects.toThrow(
      'image-data'
    );
  });

  test('rejects protocol-relative and slash-backslash custom quest tile routes before writes', async () => {
    for (const route of ['//evil.example/quest', '/\\evil.example/quest']) {
      await expect(
        restoreCustomContentBackup({
          schemaVersion: 1,
          quests: [{ id: 'quest-A', route }],
        })
      ).rejects.toMatchObject({ code: 'url' });
    }
  });
});
