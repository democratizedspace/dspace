const {
    startProcess,
    hasRequiredAndConsumedItems,
    ProcessStates,
    getProcessState,
    getProcessStartedAt,
    getProcessProgress,
    finishProcess,
    cancelProcess,
    getProcessesForItem,
    skipProcess,
  } = require("../../src/utils/gameState/processes.js");
  
  const {
    loadGameState,
    saveGameState,
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
        createItems: [{id: "3", count: 1}],
        duration: "10s", 
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

    test("hasRequiredAndConsumedItems should return true if all items are available", () => {
        expect(hasRequiredAndConsumedItems("foo")).toBe(true);
    });

    test("hasRequiredAndConsumedItems should return false if any item is missing", () => {
        mockGameState.inventory["1"] = 0;
        expect(hasRequiredAndConsumedItems("foo")).toBe(false);
    });

    test("hasRequiredAndConsumedItems should return false if the process ID is invalid", () => {
        expect(hasRequiredAndConsumedItems("bar")).toBe(false);
    });

    test("startProcess should not start if any item is missing", () => {
        mockGameState.inventory["1"] = 0;
        startProcess("foo");
        expect(mockGameState.processes["foo"]).toBeUndefined();
    });
  
    test("startProcess should start correctly", () => {
      startProcess("foo");
  
      expect(mockGameState.processes["foo"]).toEqual({
        startedAt: expect.any(Number),
        duration: expect.any(Number),
      });
    });

    test("startProcess should add the process to the game state", () => {
      startProcess("foo");
      expect(mockGameState.processes["foo"]).toEqual({
        startedAt: expect.any(Number),
        duration: expect.any(Number),
      });
    });

    test("calling startProcess should burn the consume items", () => {
      startProcess("foo");
      expect(mockGameState.inventory["2"]).toBe(47);
    });

    test("calling startProcess should not burn the require items", () => {
      startProcess("foo");
      expect(mockGameState.inventory["1"]).toBe(10);
    });

    test("getProcessState should return NOT_STARTED if the process has not started", () => {
        const { state, progress } = getProcessState("foo");
        expect(state).toBe(ProcessStates.NOT_STARTED);
        expect(progress).toBe(0);
    });

    test("getProcessState should return IN_PROGRESS if the process is in progress", () => {
        startProcess("foo");

        // elapse 5 seconds
        mockGameState.processes["foo"].startedAt = Date.now() - 5000;
        
        const { state, progress } = getProcessState("foo");
        expect(state).toBe(ProcessStates.IN_PROGRESS);
        expect(progress).toBeGreaterThan(0);
    });

    test("getProcessState should return FINISHED if the process is finished", () => {
        startProcess("foo");
        
        // elapse 20 seconds
        mockGameState.processes["foo"].startedAt = Date.now() - 20000;
        
        const { state, progress } = getProcessState("foo");
        expect(state).toBe(ProcessStates.FINISHED);
        expect(progress).toBe(100);
    });

    test("getProcessStartedAt should return undefined if the process has not started", () => {
        expect(getProcessStartedAt("foo")).toBeUndefined();
    });

    test("getProcessStartedAt should return the correct value if the process has started", () => {
        startProcess("foo");
        expect(getProcessStartedAt("foo")).toBe(mockGameState.processes["foo"].startedAt);
    });

    test("getProcessProgress should return 0 if the process has not started", () => {
        expect(getProcessProgress("foo")).toBe(0);
    });

    test("getProcessProgress should return the correct value if the process is in progress", () => {
        startProcess("foo");
        mockGameState.processes["foo"].startedAt = Date.now() - 5000;
        expect(getProcessProgress("foo")).toBeGreaterThan(0);
    });

    test("getProcessProgress should return 100 if the process is finished", () => {
        startProcess("foo");
        mockGameState.processes["foo"].startedAt = Date.now() - 20000;
        expect(getProcessProgress("foo")).toBe(100);
    });

    test("finishProcess should not do anything if the process is not finished", () => {
        finishProcess("foo");
        expect(mockGameState.processes["foo"]).toBeUndefined();
    });

    test("finishProcess should add the created items to the inventory", () => {
        startProcess("foo");
        mockGameState.processes["foo"].startedAt = Date.now() - 20000;
        finishProcess("foo");
        expect(mockGameState.inventory["3"]).toBe(1);
    });

    test("finishProcess should remove the process from the game state", () => {
        startProcess("foo");
        mockGameState.processes["foo"].startedAt = Date.now() - 20000;
        finishProcess("foo");
        expect(mockGameState.processes["foo"]).toBeUndefined();
    });

    test("finishProcess should revert the process state to NOT_STARTED if the process is finished", () => {
        startProcess("foo");
        mockGameState.processes["foo"].startedAt = Date.now() - 20000;
        finishProcess("foo");
        expect(getProcessState("foo").state).toBe(ProcessStates.NOT_STARTED);
    });

    test("cancelProcess should not do anything if the process is not started", () => {
        cancelProcess("foo");
        expect(mockGameState.processes["foo"]).toBeUndefined();

        // inventory should not change
        expect(mockGameState.inventory).toEqual({
            "1": 10,
            "2": 50,
        });
    });

    test("cancelProcess should not do anything if the process ID is invalid", () => {
        cancelProcess("bar");
        expect(mockGameState.processes["bar"]).toBeUndefined();
    });

    test("cancelProcess should cancel the process if it is in progress", () => {
        startProcess("foo");
        cancelProcess("foo");
        expect(mockGameState.processes["foo"]).toBeUndefined();
    });

    test("cancelProcess should return the consumed items to the inventory", () => {
        startProcess("foo");
        cancelProcess("foo");
        expect(mockGameState.inventory["2"]).toBe(50);
    });

    test("getProcessesForItem should return the correct processes", () => {
        expect(getProcessesForItem("1")).toEqual({"requireItem": ["foo"]});
        expect(getProcessesForItem("2")).toEqual({"consumeItem": ["foo"]});
        expect(getProcessesForItem("3")).toEqual({"createItem": ["foo"]});
    });

    test("getProcessesForItem should return an empty array if no processes are found", () => {
        // hypothetical invalid item ID
        expect(getProcessesForItem("999")).toEqual({});
    });

    test("skipProcess should work even if the process is not started", () => {
        skipProcess("foo");
        expect(mockGameState.processes["foo"]).toBeUndefined();
    });

    test("skipProcess should do nothing if the process ID is invalid", () => {
        skipProcess("bar");
        expect(mockGameState.processes["bar"]).toBeUndefined();
    });

    test("skipProcess should work even if the process is finished", () => {
        startProcess("foo");
        mockGameState.processes["foo"].startedAt = Date.now() - 20000;
        skipProcess("foo");
        expect(mockGameState.processes["foo"]).toBeUndefined();
    });

    test("skipProcess should immediately finish the process", () => {
        startProcess("foo");
        skipProcess("foo");
        expect(getProcessState("foo").state).toBe(ProcessStates.NOT_STARTED);
    });

    test("skipProcess should add the created items to the inventory", () => {
        startProcess("foo");
        skipProcess("foo");
        expect(mockGameState.inventory["3"]).toBe(1);
    });

    test("skipProcess should remove the process from the game state", () => {
        startProcess("foo");
        skipProcess("foo");
        expect(mockGameState.processes["foo"]).toBeUndefined();
    });

    test("skipProcess should revert the process state to NOT_STARTED if the process is finished", () => {
        startProcess("foo");
        skipProcess("foo");
        expect(getProcessState("foo").state).toBe(ProcessStates.NOT_STARTED);
    });

    test("skipProcess should remove the consume items from the inventory", () => {
        startProcess("foo");
        skipProcess("foo");
        expect(mockGameState.inventory["2"]).toBe(47);
    });
  });