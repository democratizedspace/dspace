// Mock implementation of testing-library/svelte
const render = (component, options = {}) => {
    const target = options.target || document.body;
    const props = options.props || {};

    // Simple mock of a rendered component
    const container = target;

    // Create a simple interface to query elements
    const getByText = (text, options = {}) => {
        // Simple implementation to find elements containing text
        const nodes = Array.from(container.querySelectorAll('*'));
        const elementsWithText = nodes.filter(
            (node) =>
                node.textContent &&
                (typeof text === 'string'
                    ? node.textContent.includes(text)
                    : text.test(node.textContent))
        );

        return elementsWithText[0] || null;
    };

    const getByLabelText = (labelTextMatcher, options = {}) => {
        // Find labels containing the text
        const labels = Array.from(container.querySelectorAll('label'));
        const matchingLabel = labels.find((label) =>
            typeof labelTextMatcher === 'string'
                ? label.textContent.includes(labelTextMatcher)
                : labelTextMatcher.test(label.textContent)
        );

        if (matchingLabel && matchingLabel.htmlFor) {
            return container.querySelector(`#${matchingLabel.htmlFor}`);
        }

        return null;
    };

    // Return testing utilities
    return {
        container,
        component: { props },
        getByText,
        getByLabelText,
        // Add other query methods as needed
    };
};

// Mock implementation of act
const act = async (callback) => {
    await callback();
};

// Mock implementation of fireEvent
const fireEvent = {
    click: (element, options = {}) => {
        // Simulate a click event
        if (element && typeof element.dispatchEvent === 'function') {
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                ...options,
            });
            element.dispatchEvent(clickEvent);
        }
        return Promise.resolve();
    },

    change: (element, options = {}) => {
        // Simulate a change event
        if (element && typeof element.dispatchEvent === 'function') {
            if (options.target) {
                // Apply properties from options.target to the element
                Object.assign(element, options.target);
            }

            const changeEvent = new Event('change', {
                bubbles: true,
                cancelable: true,
            });
            element.dispatchEvent(changeEvent);
        }
        return Promise.resolve();
    },

    input: (element, options = {}) => {
        // Simulate an input event
        if (element && typeof element.dispatchEvent === 'function') {
            if (options.target) {
                // Apply properties from options.target to the element
                Object.assign(element, options.target);
            }

            const inputEvent = new Event('input', {
                bubbles: true,
                cancelable: true,
            });
            element.dispatchEvent(inputEvent);
        }
        return Promise.resolve();
    },

    // Add other event methods as needed
};

// Mock implementation of waitFor
const waitFor = async (callback, options = {}) => {
    const { timeout = 1000, interval = 50 } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        try {
            const result = callback();
            if (result !== undefined) {
                return result;
            }
        } catch (error) {
            // Ignore errors during waiting
        }

        // Wait for the next interval
        await new Promise((resolve) => setTimeout(resolve, interval));
    }

    // Last attempt before throwing timeout error
    return callback();
};

// Export all the mock functions
module.exports = {
    render,
    act,
    fireEvent,
    waitFor,
    // Add other exports as needed
};
