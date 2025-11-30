import { isBrowser } from '../../utils/ssr.js';

// accepts an object or list as a value
// Only works in browser environment
export const setLocalStorage = (key, value) => {
    if (!isBrowser) return;
    localStorage.setItem(key, JSON.stringify(value));

    // get the value from local storage and verify that it matches value
    const storedValue = JSON.parse(localStorage.getItem(key));
    if (storedValue !== value) {
        throw new Error(`Failed to set local storage item ${key}`);
    }
};
