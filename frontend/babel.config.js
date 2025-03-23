const config = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: 'current',
                },
                modules: 'commonjs',
            },
        ],
    ],
    plugins: [
        '@babel/plugin-syntax-import-assertions',
        '@babel/plugin-transform-runtime',
        '@babel/plugin-syntax-import-meta',
    ],
    sourceType: 'unambiguous',
};

export default config;
