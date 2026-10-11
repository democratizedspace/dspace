import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  clearGitHubToken,
  loadGitHubToken,
  saveGitHubToken,
} from '../frontend/src/utils/githubToken.js';
import { closeGameStateDatabaseForTesting } from '../frontend/src/utils/gameState/common.js';

const TOKEN = 'ghp_' + 'a'.repeat(36);

async function resetState() {
  localStorage.clear();
  sessionStorage.clear();
  await closeGameStateDatabaseForTesting();
}

describe('GitHub token persistence', () => {
  beforeEach(async () => {
    await resetState();
  });

  afterEach(async () => {
    await clearGitHubToken();
    await resetState();
  });

  it('mirrors the token only after the strict save completes', async () => {
    // Ensure the game state module has finished its initial load cycle.
    await loadGitHubToken();

    const savePromise = saveGitHubToken(TOKEN);

    expect(localStorage.getItem('gameState')).toBeNull();
    await savePromise;
    const rawState = localStorage.getItem('gameState');
    expect(rawState).not.toBeNull();

    const parsedState = JSON.parse(rawState ?? '{}') as {
      github?: { token?: string };
    };
    expect(parsedState.github?.token).toBe(TOKEN);

    await expect(loadGitHubToken()).resolves.toBe(TOKEN);
  });
});
