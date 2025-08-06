/**
 * Pre-approve build scripts for selected native dependencies.
 * This allows CI to install without manual `pnpm approve-builds`.
 */
const APPROVED_DEPENDENCIES = ['canvas', 'esbuild', '@swc/core'];

module.exports = {
  hooks: {
    afterAllResolved(lockfile, context) {
      for (const name of APPROVED_DEPENDENCIES) {
        context.resolutionBuilds.add(name);
      }
      return lockfile;
    },
  },
};
