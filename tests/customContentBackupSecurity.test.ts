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
    ).rejects.toThrow('Unsafe preview text');

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
      'Invalid image data in backup'
    );
  });

  test('normalizes protocol-relative and slash-backslash custom quest tile routes', async () => {
    const planRoutes: Record<string, string> = {};
    const backup = {
      schemaVersion: BACKUP_SCHEMA_VERSION,
      timestamp: new Date().toISOString(),
      counts: { items: 0, processes: 0, quests: 2, images: 0 },
      items: [],
      processes: [],
      quests: [
        {
          id: 'protocol-relative-quest',
          title: 'Protocol Relative Quest',
          description:
            'Protocol-relative routes should fall back to internal quest URLs.',
          image: '/favicon.ico',
          route: '//evil.example/quest',
        },
        {
          id: 'slash-backslash-quest',
          title: 'Slash Backslash Quest',
          description: 'Slash-backslash routes should also fall back safely.',
          image: '/favicon.ico',
          route: '/\\evil.example/quest',
        },
      ],
      images: [],
    };

    await restoreCustomContentBackup(backup, {
      onProgress: (event: {
        type: string;
        assets?: Array<{
          kind: string;
          entity?: { id?: string; route?: string };
        }>;
      }) => {
        if (event.type !== 'plan') {
          return;
        }
        event.assets?.forEach((asset) => {
          if (
            asset.kind === 'quest' &&
            asset.entity?.id &&
            asset.entity.route
          ) {
            planRoutes[asset.entity.id] = asset.entity.route;
          }
        });
      },
    });

    expect(planRoutes['protocol-relative-quest']).toBe(
      '/quests/protocol-relative-quest'
    );
    expect(planRoutes['slash-backslash-quest']).toBe(
      '/quests/slash-backslash-quest'
    );
  });
});
