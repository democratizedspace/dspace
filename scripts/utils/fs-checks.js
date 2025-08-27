const fs = require('fs');
const path = require('path');

const DATA_URL_RE = /^data:/i;
const REMOTE_URL_RE = /^(?:https?:)?\/\//i;
const DEFAULT_PUBLIC_DIR = path.join(__dirname, '..', '..', 'frontend', 'public');

const isLocalPath = (url) => !DATA_URL_RE.test(url) && !REMOTE_URL_RE.test(url);

const decodeSafely = (str) => {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
};

/**
 * Returns image paths that are missing from the public directory.
 * Handles query strings, hash fragments, and percent-encoded segments.
 *
 * @param {string[]} imagePaths
 * @param {string} [publicDir=DEFAULT_PUBLIC_DIR]
 * @returns {string[]}
 */
function listMissingImages(imagePaths, publicDir = DEFAULT_PUBLIC_DIR) {
  return imagePaths.filter((img) => {
    const base = img.trim().replace(/[?#].*$/, '');
    if (!isLocalPath(base)) {
      return false;
    }

    const decoded = decodeSafely(base.replace(/^\//, ''));
    return !fs.existsSync(path.join(publicDir, decoded));
  });
}

module.exports = { listMissingImages };

