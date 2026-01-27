export interface ChangelogNote {
    message: string;
    href: string;
    linkLabel: string;
}

const notesBySlug: Record<string, ChangelogNote[]> = {
    '20221019': [
        {
            message:
                'Process reservations evolved significantly after this build. For the v3 behavior and related fixes, take a look at the March 1, 2026 release notes.',
            href: '/docs/changelog/20260301',
            linkLabel: 'March 1, 2026 changelog',
        },
        {
            message:
                'Process requirements are now enforced for both materials and machines. Review the latest guide for the fully shipped workflow.',
            href: '/docs/processes',
            linkLabel: 'Process guide',
        },
    ],
    '20221031': [
        {
            message:
                'The promised documentation expansion landed with the v2 launch later that summer. You can trace the follow-up in the June 30, 2023 changelog.',
            href: '/docs/changelog/20230630',
            linkLabel: 'June 30, 2023 changelog',
        },
    ],
    '20221210': [
        {
            message:
                'The energy and offset systems described below evolved over time. For the up-to-date renewable workflow, review the March 1, 2026 release notes.',
            href: '/docs/changelog/20260301',
            linkLabel: 'March 1, 2026 changelog',
        },
        {
            message:
                'You can now burn dCarbon by spending dUSD to mint dOffset via the dCarbon to dOffset process. See the updated guide for the exact steps.',
            href: '/docs/dCarbon',
            linkLabel: 'dCarbon guide',
        },
    ],
    '20230101': [
        {
            message:
                'Need the modern process reservation rules? They are documented alongside the v3 architecture refresh in the March 1, 2026 release notes.',
            href: '/docs/changelog/20260301',
            linkLabel: 'March 1, 2026 changelog',
        },
    ],
    '20230630': [
        {
            message:
                'Inventory filters landed on the Manage Items page after this release. Review the updated inventory guide for details on the shipped chips and how to toggle them.',
            href: '/docs/inventory',
            linkLabel: 'Inventory guide',
        },
        {
            message:
                'Inventory filters, the contributor tooling roadmap, and the dChat knowledge base all matured in the March 1, 2026 release. Read the v3 changelog for the latest details.',
            href: '/docs/changelog/20260301',
            linkLabel: 'March 1, 2026 changelog',
        },
        {
            message:
                'Branching questlines now live inside the Quest Trees map so you can browse the shipped dialogue paths and requirements.',
            href: '/docs/quest-trees',
            linkLabel: 'Quest trees',
        },
        {
            message:
                'The long-promised Contributors Guide is now live with workflow and testing guidance ' +
                'plus documentation checklists for new pull requests.',
            href: '/docs/contributors-guide',
            linkLabel: 'Contributors Guide',
        },
        {
            message:
                'Pair the new guide with the contributor landing page for quickstart checklists and ' +
                'links back to the core repository docs.',
            href: '/docs/contribute',
            linkLabel: 'Contribute doc',
        },
        {
            message:
                'Open-ended NPC chat is now live through the dChat personas and their quest-aware knowledge base. ' +
                'Visit the NPC guide for the latest conversation tips.',
            href: '/docs/npcs',
            linkLabel: 'NPC guide',
        },
    ],
    '20230915': [
        {
            message:
                'Cloud Sync and cross-device backups arrived in the March 1, 2026 release. Check that changelog for setup instructions.',
            href: '/docs/changelog/20260301',
            linkLabel: 'March 1, 2026 changelog',
        },
    ],
};

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function renderChangelogNotes(slug: string | undefined): string {
    if (!slug) {
        return '';
    }

    const notes = notesBySlug[slug];

    if (!notes || notes.length === 0) {
        return '';
    }

    const body = notes
        .map((note) => {
            const safeMessage = escapeHtml(note.message);
            const safeHref = escapeHtml(note.href);
            const safeLabel = escapeHtml(note.linkLabel);
            return `<p>${safeMessage} <a href="${safeHref}">${safeLabel}</a>.</p>`;
        })
        .join('');

    return `<aside class="changelog-note" aria-label="Historical note"><strong>Note:</strong>${body}</aside>`;
}

export function appendChangelogNotes(html: string, slug: string | undefined): string {
    return html + renderChangelogNotes(slug);
}

export function getChangelogNotes(slug: string | undefined): ChangelogNote[] {
    if (!slug) {
        return [];
    }

    return notesBySlug[slug] ?? [];
}
