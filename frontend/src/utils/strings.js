/**
 * Returns a string representation of the duration and remaining time.
 * @param {number} duration - The duration value, representing the current 
 *   progress percentage.
 * @param {string} remainingTime - The remaining time, represented as a 
 *   human-readable string.
 * @returns {string} The string representing the duration and remaining time. 
 *   If the duration is less than 100%, the remaining time will also be included.
 */

/**
 * Sanitizes duration values to prevent NaN, Infinity, and out-of-range values.
 * @param {number} duration - The duration value to sanitize.
 * @returns {number} The sanitized duration value, clamped between 0 and 100.
 */
const sanitizeDuration = (duration) => {
    const num = Number(duration);
    if (Number.isNaN(num)) {
        return 0;
    }
    if (!Number.isFinite(num)) {
        return num > 0 ? 100 : 0;
    }
    return Math.min(Math.max(num, 0), 100);
};

export const getDurationString = (duration, remainingTime) => {
  const value = sanitizeDuration(duration);
  let durationStr = `${value.toFixed(2)}%`;
  return value < 100 ? `${durationStr} - ${remainingTime}` : durationStr;
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
