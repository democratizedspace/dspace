import { glob } from 'glob';
import path from 'node:path';

export const globDocsFiles = async (pattern) => {
  // These patterns come from path.join(): Windows backslashes are separators, not escapes.
  const files = await glob(pattern, {
    nodir: true,
    windowsPathsNoEscape: true,
  });
  // Keep downstream archive filtering based on path.sep independent of glob's formatting.
  return files.map((file) => path.normalize(file));
};
