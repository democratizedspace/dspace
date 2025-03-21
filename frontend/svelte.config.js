const path = require('path');

module.exports = {
    preprocess: [],
    compilerOptions: {
        dev: true
    },
    kit: {
        vite: {
            resolve: {
                alias: {
                    $lib: path.resolve('./src')
                }
            }
        }
    }
}; 