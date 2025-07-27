export function calculateHydrationTime(start, end) {
    if (typeof start !== 'number' || typeof end !== 'number') {
        throw new Error('start and end must be numbers');
    }
    return end - start;
}

