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
export const getDurationString = (duration, remainingTime) => {
    const durationStr = getDuration(duration);
    if (duration < 100 && remainingTime) {
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
export const getDuration = (duration) => `${duration.toFixed(2)}%`;
