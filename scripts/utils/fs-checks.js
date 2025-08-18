const fs = require('fs');
const path = require('path');

const DATA_URL_RE = /^data:/i;
const REMOTE_URL_RE = /^(?:https?:)?\/\//i;

function decodeSafely(str) {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

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
    // Strip query strings or hash fragments so existence checks aren't fooled
    const base = img.split(/[?#]/)[0];
    if (DATA_URL_RE.test(base) || REMOTE_URL_RE.test(base)) {
      return false;
    }
    const rel = base.startsWith('/') ? base.slice(1) : base;
    const decoded = decodeSafely(rel);
    const full = path.join(publicDir, decoded);
    return !fs.existsSync(full);
  });
}

module.exports = { listMissingImages };

