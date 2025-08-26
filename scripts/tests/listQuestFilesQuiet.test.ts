import { expect, test, vi } from 'vitest';
import { listQuestFiles } from '../update-new-quests.js';

test('listQuestFiles suppresses git stderr for missing refs', () => {
  const spy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  try {
    listQuestFiles('origin/v3');
  } catch {
    /* ignore */
  }
  expect(spy).not.toHaveBeenCalled();
  spy.mockRestore();
});
