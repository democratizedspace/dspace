import { beforeEach, describe, expect, it, vi } from 'vitest';

let mockState: any;

vi.mock('../frontend/src/utils/gameState/common.js', () => ({
  loadGameState: vi.fn(() => mockState),
  saveGameState: vi.fn((nextState) => {
    mockState = nextState;
  }),
}));

import {
  addContainerItems,
  getContainerItemCount,
  getContainerItemCounts,
  removeContainerItems,
  supportsContainerItem,
} from '../frontend/src/utils/gameState/inventory.js';
import {
  ProcessStates,
  finishProcess,
  getProcessState,
  hasRequiredAndConsumedItems,
  startProcess,
} from '../frontend/src/utils/gameState/processes.js';

const DUSD_ID = '5247a603-294a-4a34-a884-1ae20969b2a1';
const SAVINGS_JAR_ID = '7fe0d9c4-6b61-4e4f-b26d-2f150f95c6c9';
const BROKEN_JAR_ID = '2d4f7e3f-3cb7-4e3e-9e7b-0ecf984f57a1';

describe('item container system', () => {
  beforeEach(() => {
    mockState = {
      inventory: {
        [DUSD_ID]: 100,
        [SAVINGS_JAR_ID]: 1,
      },
      itemCounts: {},
      processes: {},
      quests: {},
      settings: {},
      _meta: { lastUpdated: Date.now() },
      versionNumberString: '3',
    };
  });

  it('enforces supported item ids for container storage', () => {
    expect(supportsContainerItem(SAVINGS_JAR_ID, DUSD_ID)).toBe(true);
    expect(supportsContainerItem(SAVINGS_JAR_ID, BROKEN_JAR_ID)).toBe(false);

    expect(addContainerItems(SAVINGS_JAR_ID, BROKEN_JAR_ID, 1)).toBe(false);
    expect(getContainerItemCounts(SAVINGS_JAR_ID)).toEqual({ [DUSD_ID]: 0 });
  });

  it('tracks and bounds floating-point container balances', () => {
    expect(addContainerItems(SAVINGS_JAR_ID, DUSD_ID, 12.75)).toBe(true);
    expect(getContainerItemCount(SAVINGS_JAR_ID, DUSD_ID)).toBe(12.75);

    expect(removeContainerItems(SAVINGS_JAR_ID, DUSD_ID, 2.25)).toBe(true);
    expect(getContainerItemCount(SAVINGS_JAR_ID, DUSD_ID)).toBe(10.5);

    expect(removeContainerItems(SAVINGS_JAR_ID, DUSD_ID, 11)).toBe(false);
    expect(getContainerItemCount(SAVINGS_JAR_ID, DUSD_ID)).toBe(10.5);
  });

  it('moves dUSD into the jar through stash process and recovers all funds when broken', () => {
    const stashProcess = {
      id: 'stash-dusd-in-savings-jar',
      title: 'stash dUSD in savings jar',
      requireItems: [{ id: SAVINGS_JAR_ID, count: 1 }],
      consumeItems: [{ id: DUSD_ID, count: 10 }],
      createItems: [],
      itemCountTransfers: [
        {
          containerId: SAVINGS_JAR_ID,
          itemId: DUSD_ID,
          direction: 'inventoryToContainer',
          amount: 10,
        },
      ],
      duration: '1s',
      hardening: { passes: 0, score: 92, emoji: '🛠️', history: [] },
    };

    const breakProcess = {
      id: 'break-savings-jar',
      title: 'break savings jar',
      requireItems: [{ id: SAVINGS_JAR_ID, count: 1 }],
      consumeItems: [{ id: SAVINGS_JAR_ID, count: 1 }],
      createItems: [{ id: BROKEN_JAR_ID, count: 1 }],
      itemCountTransfers: [
        {
          containerId: SAVINGS_JAR_ID,
          itemId: DUSD_ID,
          direction: 'containerToInventory',
          amount: 'all',
        },
      ],
      duration: '1s',
      hardening: { passes: 0, score: 94, emoji: '🛠️', history: [] },
    };

    expect(
      hasRequiredAndConsumedItems('stash-dusd-in-savings-jar', stashProcess)
    ).toBe(true);
    startProcess('stash-dusd-in-savings-jar', stashProcess);
    mockState.processes['stash-dusd-in-savings-jar'].startedAt =
      Date.now() - 2_000;
    mockState.processes['stash-dusd-in-savings-jar'].duration = 1;
    expect(getProcessState('stash-dusd-in-savings-jar').state).toBe(
      ProcessStates.FINISHED
    );
    finishProcess('stash-dusd-in-savings-jar', stashProcess);

    expect(mockState.inventory[DUSD_ID]).toBe(90);
    expect(getContainerItemCount(SAVINGS_JAR_ID, DUSD_ID)).toBe(10);

    expect(hasRequiredAndConsumedItems('break-savings-jar', breakProcess)).toBe(
      true
    );
    startProcess('break-savings-jar', breakProcess);
    mockState.processes['break-savings-jar'].startedAt = Date.now() - 2_000;
    mockState.processes['break-savings-jar'].duration = 1;
    expect(getProcessState('break-savings-jar').state).toBe(
      ProcessStates.FINISHED
    );
    finishProcess('break-savings-jar', breakProcess);

    expect(mockState.inventory[SAVINGS_JAR_ID]).toBe(0);
    expect(mockState.inventory[BROKEN_JAR_ID]).toBe(1);
    expect(mockState.inventory[DUSD_ID]).toBe(100);
    expect(getContainerItemCount(SAVINGS_JAR_ID, DUSD_ID)).toBe(0);
  });
});
