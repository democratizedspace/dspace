export const getQuestTreesFromModulePaths = (modulePaths = []) => {
    const trees = modulePaths
        .map((modulePath) => {
            const normalizedPath = String(modulePath).replace(/\\/g, '/');
            const match = normalizedPath.match(/\/quests\/json\/([^/]+)\//);
            return match?.[1]?.toLowerCase() ?? '';
        })
        .filter(Boolean);

    return [...new Set(trees)].sort((left, right) => left.localeCompare(right));
};

const getSlugFromHref = (href = '') => {
    const clean = String(href).split('#')[0].split('?')[0];

    if (!clean.startsWith('/docs/')) {
        return '';
    }

    return clean
        .replace(/^\/docs\//, '')
        .replace(/\/?$/, '')
        .toLowerCase();
};

export const mergeSkillLinks = ({ curatedLinks = [], generatedLinks = [], aliases = {} } = {}) => {
    const getCanonicalTree = (slug = '') => aliases[slug] ?? slug;
    const curatedSkillLinksByTree = new Map();

    const normalizedCuratedLinks = curatedLinks.map((link) => {
        const slug = getSlugFromHref(link?.href);
        const canonicalTree = getCanonicalTree(slug);

        if (!curatedSkillLinksByTree.has(canonicalTree)) {
            curatedSkillLinksByTree.set(canonicalTree, true);
        }

        return link;
    });

    const mergedGeneratedLinks = generatedLinks.filter((link) => {
        const treeSlug = getSlugFromHref(link?.href);
        return !curatedSkillLinksByTree.has(treeSlug);
    });

    return [...normalizedCuratedLinks, ...mergedGeneratedLinks].sort((left, right) =>
        left.title.localeCompare(right.title)
    );
};
