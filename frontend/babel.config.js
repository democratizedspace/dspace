module.exports = {
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
    '@babel/plugin-transform-runtime',
    '@babel/plugin-syntax-import-meta',
    '@babel/plugin-transform-modules-commonjs',
  ],
  sourceType: 'unambiguous'
}; 