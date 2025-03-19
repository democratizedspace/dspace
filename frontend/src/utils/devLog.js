// Simple development logging utility
export const log = (...args) => {
    // Only log in development environment
    if (process.env.NODE_ENV === 'development') {
        console.log(...args);
    }
}; 