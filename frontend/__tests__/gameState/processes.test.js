const {
    startProcess, 
  } = require("../../src/utils/gameState/processes.js");
  
  const {
    loadGameState,
    saveGameState  
  } = require("../../src/utils/gameState/common.js");
  
  // Mock common.js imports
  jest.mock("../../src/utils/gameState/common.js", () => {
    return {
      loadGameState: jest.fn(),
      saveGameState: jest.fn(),
    };
  });
  
  // Mock processes import
  jest.mock("../../src/pages/processes/processes.json", () => {
    return [
      {
        id: "foo",
        requireItems: [{id: "1", count: 5}],
        consumeItems: [{id: "2", count: 3}], 
      }
    ];
  });
  
  describe("gameState - processes", () => {
  
    let mockGameState;
  
    beforeEach(() => {
      mockGameState = {
        inventory: {
          "1": 10,
          "2": 50
        },
        processes: {},
      };
  
      loadGameState.mockImplementation(() => mockGameState);
      
      saveGameState.mockImplementation((newState) => {
        mockGameState = newState;
      });
  
      loadGameState.mockClear();
      saveGameState.mockClear();
    });
  
    test("startProcess should start correctly", () => {
      startProcess("foo");
  
      expect(mockGameState.processes["foo"]).toEqual({
        startedAt: expect.any(Number),
        duration: expect.any(Number),
      });
  
    });
  
  });