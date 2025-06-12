// Simple development logging utility
export const log = (...args) => {
    // Only log in development environment
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
        console.log(...args);
    }
};
