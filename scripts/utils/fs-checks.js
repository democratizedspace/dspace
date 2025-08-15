const fs = require('fs');
const path = require('path');

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
    const missing = [];
    imagePaths.forEach((img) => {
        // Strip query strings or hash fragments so existence checks aren't fooled
        const base = img.split(/[?#]/)[0];
        if (/^data:/i.test(base) || /^(?:https?:)?\/\//i.test(base)) {
            return;
        }
        const rel = base.startsWith('/') ? base.slice(1) : base;
        let decoded;
        try {
            decoded = decodeURIComponent(rel);
        } catch {
            decoded = rel;
        }
        const full = path.join(publicDir, decoded);
        const resolved = path.resolve(full);
        const root = path.resolve(publicDir);
        if (!resolved.startsWith(root + path.sep)) {
            missing.push(img);
            return;
        }
        if (!fs.existsSync(resolved)) {
            missing.push(img);
        }
    });
    return missing;
}

module.exports = { listMissingImages };
