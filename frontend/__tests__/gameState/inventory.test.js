const {
  addItems,
  burnItems,
  getItemCounts,
  getItemCount,
  getCurrentdUSD,
  buyItems,
  sellItems,
  hasItems,
} = require("../../src/utils/gameState/inventory.js");

const { loadGameState, saveGameState } = require("../../src/utils/gameState/common.js");

jest.mock("../../src/utils/gameState/common.js", () => {
  return {
    loadGameState: jest.fn(),
    saveGameState: jest.fn(),
  };
});

describe("gameState - inventory", () => {
  let mockGameState;

  beforeEach(() => {
    mockGameState = {
      inventory: {
        "1": 10,
        "24": 50,
        "20": 0,
      },
    };

    loadGameState.mockImplementation(() => mockGameState);
    saveGameState.mockImplementation((newState) => { mockGameState = newState; });

    loadGameState.mockClear();
    saveGameState.mockClear();
  });

  // Your existing sellItems tests go here...

  test("addItems should correctly add items to the inventory", () => {
    const itemsToAdd = [{ id: "1", count: 5 }, { id: "2", count: 3 }];

    addItems(itemsToAdd);

    expect(loadGameState).toHaveBeenCalledTimes(1);
    expect(saveGameState).toHaveBeenCalledTimes(1);

    const expectedInventory = {
      "1": 15, // The count of item "1" should have increased by 5
      "2": 3, // The count of new item "2" should be 3
      "24": 50, // The counts of other items should not change
      "20": 0,
    };

    expect(mockGameState.inventory).toEqual(expectedInventory);
  });

  test("burnItems should correctly burn items from the inventory", () => {
    const itemsToBurn = [{ id: "1", count: 5 }];

    burnItems(itemsToBurn);

    expect(loadGameState).toHaveBeenCalledTimes(1);
    expect(saveGameState).toHaveBeenCalledTimes(1);

    const expectedInventory = {
      "1": 5, // The count of item "1" should have decreased by 5
      "24": 50, // The counts of other items should not change
      "20": 0,
    };

    expect(mockGameState.inventory).toEqual(expectedInventory);
  });

  test("getItemCounts should correctly return counts of items", () => {
    const items = [{ id: "1" }, { id: "2" }];

    const counts = getItemCounts(items);

    expect(loadGameState).toHaveBeenCalledTimes(1);

    const expectedCounts = {
      "1": 10, // The count of item "1" should be 10
      "2": 0, // The count of item "2" should be 0 since it doesn't exist in the inventory
    };

    expect(counts).toEqual(expectedCounts);
  });

  test("getItemCount should correctly return the count of a specific item", () => {
    const count = getItemCount("1");

    expect(loadGameState).toHaveBeenCalledTimes(1);

    expect(count).toBe(10);
  });

  test("getCurrentdUSD should correctly return the count of dUSD", () => {
    const count = getCurrentdUSD();

    expect(loadGameState).toHaveBeenCalledTimes(1);

    expect(count).toBe(50);
  });

  test("buyItems should correctly deduct the cost from dUSD and add items to the inventory", () => {
    const itemsToBuy = [{ id: "1", quantity: 2, price: "5" }];

    buyItems(itemsToBuy);

    expect(loadGameState).toHaveBeenCalledTimes(1);
    expect(saveGameState).toHaveBeenCalledTimes(1);

    const expectedInventory = {
      "1": 12, // The count of item "1" should have increased by 2
      "24": 40, // The count of dUSD should have decreased by 10 (2 items * price 5)
      "20": 0,
    };

    expect(mockGameState.inventory).toEqual(expectedInventory);
  });

  test("hasItems should correctly check if the inventory has enough of each item", () => {
    const items = [{ id: "1", count: 5 }, { id: "2", count: 1 }];

    const result = hasItems(items);

    expect(loadGameState).toHaveBeenCalledTimes(1);

    expect(result).toBe(false); // The function should return false since the inventory doesn't have enough of item "2"
  });
});
