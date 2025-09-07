import { afterEach, beforeEach, describe, expect, it, jest, test } from 'vitest';
import * as gameState from '../src/utils/gameState.js';

// Mock the gameState module
jest.mock('../src/utils/gameState.js', () => ({
    questFinished: jest.fn(),
    canStartQuest: jest.fn(),
}));

// Mock IndexedDB
class MockIDBRequest {
    constructor() {
        this.result = null;
        this.error = null;
    }

    triggerSuccess(result) {
        this.result = result;
        if (this.onsuccess) this.onsuccess({ target: this });
    }

    triggerError(error) {
        this.error = error;
        if (this.onerror) this.onerror({ target: this });
    }

    triggerUpgradeNeeded(db) {
        if (this.onupgradeneeded) this.onupgradeneeded({ target: { result: db } });
    }
}

class MockIDBObjectStore {
    constructor(name) {
        this.name = name;
        this.data = [];
    }

    add(item) {
        const request = new MockIDBRequest();
        this.data.push(item);
        setTimeout(() => request.triggerSuccess(item.id || this.data.length), 0);
        return request;
    }

    getAll() {
        const request = new MockIDBRequest();
        setTimeout(() => request.triggerSuccess(this.data), 0);
        return request;
    }

    get(id) {
        const request = new MockIDBRequest();
        const item = this.data.find((item) => item.id === id);
        setTimeout(() => request.triggerSuccess(item), 0);
        return request;
    }

    delete(id) {
        const request = new MockIDBRequest();
        const index = this.data.findIndex((item) => item.id === id);
        if (index >= 0) {
            this.data.splice(index, 1);
            setTimeout(() => request.triggerSuccess(), 0);
        } else {
            setTimeout(() => request.triggerError(new Error('Not found')), 0);
        }
        return request;
    }
}

class MockIDBTransaction {
    constructor(stores) {
        this.stores = stores;
    }

    objectStore(name) {
        return this.stores[name];
    }
}

class MockIDBDatabase {
    constructor() {
        this.stores = {};
        this.objectStoreNames = {
            contains: (name) => !!this.stores[name],
        };
    }

    createObjectStore(name, options) {
        this.stores[name] = new MockIDBObjectStore(name);
        return this.stores[name];
    }

    transaction(storeNames, mode) {
        return new MockIDBTransaction(this.stores);
    }
}

// Mock the global indexedDB
global.indexedDB = {
    open: function (name, version) {
        const request = new MockIDBRequest();
        const db = new MockIDBDatabase();

        // Simulate async behavior
        setTimeout(() => {
            request.triggerUpgradeNeeded(db);
            request.triggerSuccess(db);
        }, 0);

        return request;
    },
};

let Quests;

describe('Quests Component', () => {
    let quests;

    beforeEach(async () => {
        Quests = (await import('../src/pages/quests/svelte/Quests.svelte')).default;

        // Set up test data
        quests = [
            {
                id: 'welcome/test1',
                title: 'Test Quest 1',
                description: 'This is a test quest',
                image: '/test1.jpg',
            },
            {
                id: 'welcome/test2',
                title: 'Test Quest 2',
                description: 'This is another test quest',
                image: '/test2.jpg',
            },
        ];

        // Set up mock responses
        gameState.questFinished.mockImplementation((id) => id === 'welcome/test2');
        gameState.canStartQuest.mockReturnValue(true);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should render action buttons', () => {
        // Create a container for the component
        const container = document.createElement('div');
        document.body.appendChild(container);

        // Mount the component
        new Quests({
            target: container,
            props: { quests },
        });

        // Wait for component to mount and render
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    // Check if action buttons are rendered
                    const buttons = container.querySelectorAll('.action-buttons a');
                    expect(buttons.length).toBe(2);
                    expect(buttons[0].textContent).toContain('Create a new quest');
                    expect(buttons[1].textContent).toContain('Managed quests');

                    // Clean up
                    document.body.removeChild(container);
                    resolve();
                } catch (e) {
                    document.body.removeChild(container);
                    throw e;
                }
            }, 100);
        });
    });

    it('should filter quests based on completion status', () => {
        // Skip test if not in browser environment
        if (typeof document === 'undefined') {
            return;
        }

        // Create a container for the component
        const container = document.createElement('div');
        document.body.appendChild(container);

        // Mock the onMount function to make it synchronous for testing
        const originalOnMount = Quests.prototype.onMount;
        Quests.prototype.onMount = function () {
            // Call the original onMount implementation synchronously
            this.mounted = true;
            if (originalOnMount) originalOnMount.call(this);
        };

        // Mount the component
        const questsComponent = new Quests({
            target: container,
            props: { quests },
        });

        try {
            // Since we made onMount synchronous, the component should be rendered immediately
            // Force reflow to ensure DOM updates
            container.getBoundingClientRect();

            // Check if available quests are rendered
            const availableQuestsSection = container.querySelector('.quests-grid');
            expect(availableQuestsSection).toBeTruthy();

            // Check if completed quests are rendered
            const completedQuestsHeading = Array.from(container.querySelectorAll('h2')).find((h) =>
                h.textContent.includes('Completed Quests')
            );
            expect(completedQuestsHeading).toBeTruthy();

            // Clean up
            document.body.removeChild(container);

            // Restore original onMount
            Quests.prototype.onMount = originalOnMount;
        } catch (e) {
            // Restore original onMount on error
            Quests.prototype.onMount = originalOnMount;
            document.body.removeChild(container);
            throw e;
        }
    });
});
