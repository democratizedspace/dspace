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
        // Skip absolute URLs (http, https, data, file, etc.) and protocol-relative sources
        if (/^[a-z][a-z+.-]*:/i.test(base) || base.startsWith('//')) {
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
        if (!fs.existsSync(full)) {
            missing.push(img);
        }
    });
    return missing;
}

module.exports = { listMissingImages };
