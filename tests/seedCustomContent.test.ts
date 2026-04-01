import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../frontend/src/utils/customcontent.js';
import path from 'path';

describe('seedCustomContent script', () => {
  it('seeds sample entities', async () => {
    const prev = process.cwd();
    process.chdir(path.join(prev, 'frontend'));
    try {
      const { seedCustomContent } = await import('../frontend/scripts/seed-custom-content.js');
      const ids = await seedCustomContent();
      const item = await db.items.get(ids.itemId);
      const processEntity = await db.processes.get(ids.processId);
      const quest = await db.quests.get(ids.questId);

      expect(item?.name).toBe('Seeded Item');
      expect(processEntity?.title).toBe('Seeded Process');
      expect(quest?.title).toBe('Map the Constellations');
    } finally {
      process.chdir(prev);
    }
  });
});
