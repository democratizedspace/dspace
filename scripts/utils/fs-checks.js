const fs = require('fs');
const path = require('path');

function listMissingImages(imagePaths, publicDir = path.join(__dirname, '..', '..', 'frontend', 'public')) {
    const missing = [];
    imagePaths.forEach((img) => {
        // Strip query strings or hash fragments so existence checks aren't fooled
        const base = img.split(/[?#]/)[0];
        if (/^https?:\/\//i.test(base)) {
            return;
        }
        const rel = base.startsWith('/') ? base.slice(1) : base;
        const full = path.join(publicDir, rel);
        if (!fs.existsSync(full)) {
            missing.push(img);
        }
    });
    return missing;
}

module.exports = { listMissingImages };
