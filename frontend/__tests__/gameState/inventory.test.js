const { loadGameState, saveGameState } = require("../../src/utils/gameState/common.js");
const { sellItems } = require("../../src/utils/gameState/inventory.js");

jest.mock("../../src/utils/gameState/common.js", () => {
  return {
    loadGameState: jest.fn(),
    saveGameState: jest.fn(),
    // Add other exports here if needed
  };
});

describe("gameState - inventory", () => {
  let mockGameState;

  beforeEach(() => {
    // Initialize a mock game state
    mockGameState = {
      inventory: {
        "1": 10, // Arbitrary initial inventory for item with id "1"
        "24": 50 // Arbitrary initial dUSD inventory
      }
    };

    // Set up what the mock functions should do
    loadGameState.mockImplementation(() => mockGameState);
    saveGameState.mockImplementation((newState) => mockGameState = newState);

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
    expect(loadGameState).toHaveBeenCalled();
    expect(saveGameState).toHaveBeenCalledTimes(1);
    
    const expectedInventory = {
      "1": 10, // Quantity of item "1" should not have changed
      "24": 50 // Quantity of dUSD should not have changed
    };

    expect(mockGameState.inventory).toEqual(expectedInventory);
  });
});
