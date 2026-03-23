function resolveGlobSync(globModule, contextLabel = 'unknown-context') {
    const globSync = globModule?.globSync || globModule?.sync || globModule;

    if (typeof globSync !== 'function') {
        throw new Error(
            `Unsupported "glob" module API in ${contextLabel}: expected globSync, sync, or a callable module export.`
        );
    }

    return globSync;
}

module.exports = { resolveGlobSync };
