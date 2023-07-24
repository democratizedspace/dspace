const { loadGameState, saveGameState } = require("../../src/utils/gameState/common.js");
const { sellItems } = require("../../src/utils/gameState/inventory.js");

jest.mock("../../src/utils/gameState/common.js", () => {
  return {
    loadGameState: jest.fn(),
    saveGameState: jest.fn(),
  };
});

describe("gameState - inventory", () => {
  let mockGameState;

  beforeEach(() => {
    // Initialize a mock game state
    mockGameState = {
      inventory: {
        "1": 10, // Arbitrary initial inventory for item with id "1"
        "24": 50, // Arbitrary initial dUSD inventory
        "20": 0   // Initializing dCarbon inventory
      }
    };

    // Set up what the mock functions should do
    loadGameState.mockImplementation(() => mockGameState);
    saveGameState.mockImplementation((newState) => { mockGameState = newState; });

    // Clear the mock implementations' histories
    loadGameState.mockClear();
    saveGameState.mockClear();
  });

  test("A player cannot sell a non-positive number of items", () => {
    const itemsToSell = [
      { id: "1", quantity: -5, price: 2 }, // Non-positive quantity
      { id: "1", quantity: 0, price: 2 } // Non-positive quantity
    ];

    // Act
    sellItems(itemsToSell);

    // Assert
    expect(loadGameState).toHaveBeenCalledTimes(1);
    expect(saveGameState).toHaveBeenCalledTimes(1);
    
    const expectedInventory = {
      "1": 10, // Quantity of item "1" should not have changed
      "24": 50, // Quantity of dUSD should not have changed
      "20": 0 // dCarbon inventory should not have changed
    };

    expect(mockGameState.inventory).toEqual(expectedInventory);
  });

  test("No tax should be applied when there's no dCarbon in the inventory", () => {
    // Set up for this specific test case
    mockGameState.inventory["20"] = 0;  // No dCarbon in the inventory

    const itemsToSell = [
      { id: "1", quantity: 5, price: 2 }
    ];

    sellItems(itemsToSell);

    expect(loadGameState).toHaveBeenCalledTimes(1);
    expect(saveGameState).toHaveBeenCalledTimes(1);

    const expectedInventory = {
      "1": 5, // Quantity of item "1" should have decreased by 5
      "24": 60, // Quantity of dUSD should have increased by 10 (5 items * price 2)
      "20": 0 // dCarbon inventory should not have changed
    };

    expect(mockGameState.inventory).toEqual(expectedInventory);
  });

  test("Tax should be applied correctly based on the amount of dCarbon", () => {
    // Adding dCarbon to the inventory
    mockGameState.inventory["20"] = 2000;

    const itemsToSell = [
      { id: "1", quantity: 5, price: 2 }
    ];

    sellItems(itemsToSell);

    expect(loadGameState).toHaveBeenCalledTimes(1);
    expect(saveGameState).toHaveBeenCalledTimes(1);

    const expectedInventory = {
      "1": 5, // Quantity of item "1" should have decreased by 5
      "20": 2000, // dCarbon should remain the same
      "24": 58 // Quantity of dUSD should have increased by 8 (5 items * price 2 * 0.8 due to 20% tax)
    };

    expect(mockGameState.inventory).toEqual(expectedInventory);
  });

  test("No more tax should be applied once dCarbon hits the max tax rate", () => {
    // Adding dCarbon to the inventory
    mockGameState.inventory["20"] = 10000;

    const itemsToSell = [
      { id: "1", quantity: 5, price: 2 }
    ];

    sellItems(itemsToSell);

    expect(loadGameState).toHaveBeenCalledTimes(1);
    expect(saveGameState).toHaveBeenCalledTimes(1);

    const expectedInventory = {
      "1": 5, // Quantity of item "1" should have decreased by 5
      "20": 10000, // dCarbon should remain the same
      "24": 51 // Quantity of dUSD should have increased by 1 (5 items * price 2 * 0.1 due to 90% tax)
    };

    expect(mockGameState.inventory).toEqual(expectedInventory);
  });
});
