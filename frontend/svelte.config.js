import path from 'path';

export default {
    preprocess: [],
    compilerOptions: {
        dev: true,
    },
    kit: {
        vite: {
            resolve: {
                alias: {
                    $lib: path.resolve('./src'),
                },
            },
        },
    },
};
