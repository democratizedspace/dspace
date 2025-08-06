/**
 * Pre-approve native deps so installs can run non-interactively.
 * See https://pnpm.io/security#pre-approving-builds
 */
module.exports = {
  config: {
    allowedBuiltDependencies: ['canvas', 'esbuild', '@swc/core']
  }
};
