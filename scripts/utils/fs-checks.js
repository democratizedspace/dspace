const fs = require('fs');
const path = require('path');

const DATA_URL_RE = /^data:/i;
const REMOTE_URL_RE = /^(?:https?:)?\/\//i;

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
 * @param {string} [publicDir=path.join(__dirname, '..', '..', 'frontend', 'public')]
 * @returns {string[]}
 */
function listMissingImages(
  imagePaths,
  publicDir = path.join(__dirname, '..', '..', 'frontend', 'public'),
) {
  return imagePaths.filter((img) => {
    const [base] = img.split(/[?#]/);
    if (!isLocalPath(base)) return false;

    const decoded = decodeSafely(base.replace(/^\//, ''));
    return !fs.existsSync(path.join(publicDir, decoded));
  });
}

module.exports = { listMissingImages };

