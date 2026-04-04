import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, test } from 'vitest';
import {
  loadGameState,
  resetGameState,
  saveGameState,
  getPersistedGameStateLightweight,
  isAuthoritativeQuestSnapshot,
} from '../frontend/src/utils/gameState/common.js';

describe('quest progress lightweight snapshot', () => {
  beforeEach(async () => {
    await resetGameState();
  });

  test('persists completed quest ids for authoritative fast-path classification', async () => {
    const state = loadGameState();
    state.quests['welcome/howtodoquests'] = { finished: true };
    await saveGameState(state);

    const snapshot = await getPersistedGameStateLightweight();

    expect(snapshot.version).toBe(2);
    expect(snapshot.completedQuestIds).toContain('welcome/howtodoquests');
    expect(isAuthoritativeQuestSnapshot(snapshot)).toBe(true);
  });

  test('treats stale snapshot versions as non-authoritative', () => {
    expect(
      isAuthoritativeQuestSnapshot({
        version: 1,
        checksum: 'abc123',
        completedQuestIds: ['welcome/howtodoquests'],
      })
    ).toBe(false);
  });
});
