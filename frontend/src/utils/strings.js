/**
 * Returns a string representation of the duration and remaining time.
 * @param {number} duration - The duration value, representing the current
 *   progress percentage.
 * @param {string} [remainingTime] - The remaining time, represented as a
 *   human-readable string. If omitted, only the duration is returned.
 * @returns {string} The string representing the duration and remaining time.
 *   If the duration is less than 100% and remaining time is provided, it will
 *   be included in the returned string.
 */
const sanitizeDuration = (duration) => {
    const num = Number(duration);
    if (!Number.isFinite(num)) {
        return 0;
    }
    return Math.min(Math.max(num, 0), 100);
};

export const getDurationString = (duration, remainingTime) => {
    const value = sanitizeDuration(duration);
    const durationStr = `${value.toFixed(2)}%`;
    if (value < 100 && remainingTime) {
        return `${durationStr} - ${remainingTime}`;
    }
    return durationStr;
};

/**
 * Returns a string representation of the duration value.
 * @param {number} duration - The duration value, representing the current
 *   progress percentage.
 * @returns {string} The string representing the duration.
 */
export const getDuration = (duration) => {
    const value = sanitizeDuration(duration);
    return `${value.toFixed(2)}%`;
};
