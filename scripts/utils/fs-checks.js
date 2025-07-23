const fs = require('fs');
const path = require('path');

function listMissingImages(imagePaths, publicDir = path.join(__dirname, '..', '..', 'frontend', 'public')) {
    const missing = [];
    imagePaths.forEach((img) => {
        const rel = img.startsWith('/') ? img.slice(1) : img;
        const full = path.join(publicDir, rel);
        if (!fs.existsSync(full)) {
            missing.push(img);
        }
    });
    return missing;
}

module.exports = { listMissingImages };
