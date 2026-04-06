/**
 * Basic statistics utility functions
 *
 * Simple helper functions for experiment result analysis.
 * Uses only mean, min, max - no advanced statistics.
 */

/**
 * Calculate the average of an array
 * @param {number[]} arr - numeric array
 * @returns {number}
 */
function mean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculate basic descriptive statistics
 * @param {number[]} arr - numeric array
 * @returns {{ mean: number, min: number, max: number, count: number }}
 */
function descriptiveStats(arr) {
  if (arr.length === 0) return { mean: 0, min: 0, max: 0, count: 0 };
  return {
    mean: parseFloat(mean(arr).toFixed(2)),
    min: parseFloat(Math.min(...arr).toFixed(2)),
    max: parseFloat(Math.max(...arr).toFixed(2)),
    count: arr.length,
  };
}

module.exports = { mean, descriptiveStats };
