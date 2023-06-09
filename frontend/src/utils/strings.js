/**
 * Returns a string representation of the duration and remaining time.
 * @param {number} duration - The duration value, representing the current 
 *   progress percentage.
 * @param {string} remainingTime - The remaining time, represented as a 
 *   human-readable string.
 * @returns {string} The string representing the duration and remaining time. 
 *   If the duration is less than 100%, the remaining time will also be included.
 */
export const getDurationString = (duration, remainingTime) => {
  let durationStr = `${getDuration(duration)}`;
  return duration < 100 ? `${durationStr} - ${remainingTime}` : durationStr;
};

/**
 * Returns a string representation of the duration value.
 * @param {number} duration - The duration value, representing the current 
 *   progress percentage.
 * @returns {string} The string representing the duration.
 */
export const getDuration = (duration) => `${duration.toFixed(2)}%`;
