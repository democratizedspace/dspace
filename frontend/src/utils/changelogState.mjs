const states = new Set(['draft', 'published']);

// Compatibility for links to the renamed, never-published August draft.
export const draftChangelogRedirects = { 20260801: '20261101' };

export function getChangelogStatus(frontmatter) {
    const status = frontmatter?.status;
    if (!states.has(status)) {
        throw new Error(
            `Changelog ${frontmatter?.slug ?? '(unknown)'} must declare status: draft or published`
        );
    }
    return status;
}

export function partitionChangelogs(entries) {
    const groups = { draft: [], published: [] };
    for (const entry of entries) {
        groups[getChangelogStatus(entry.frontmatter)].push(entry);
    }
    for (const entriesForStatus of Object.values(groups)) {
        entriesForStatus.sort((a, b) =>
            String(b.frontmatter.slug).localeCompare(String(a.frontmatter.slug))
        );
    }
    return groups;
}
