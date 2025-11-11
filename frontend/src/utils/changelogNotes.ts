export interface ChangelogNote {
    message: string;
    href: string;
    linkLabel: string;
}

const notesBySlug: Record<string, ChangelogNote[]> = {
    '20221019': [
        {
            message:
                'Process reservations evolved significantly after this build. For the v3 behavior and related fixes, take a look at the November 1, 2025 release notes.',
            href: '/docs/changelog/20251101',
            linkLabel: 'November 1, 2025 changelog',
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
                'The energy and offset systems described below evolved over time. For the up-to-date renewable workflow, review the November 1, 2025 release notes.',
            href: '/docs/changelog/20251101',
            linkLabel: 'November 1, 2025 changelog',
        },
    ],
    '20230101': [
        {
            message:
                'Need the modern process reservation rules? They are documented alongside the v3 architecture refresh in the November 1, 2025 release notes.',
            href: '/docs/changelog/20251101',
            linkLabel: 'November 1, 2025 changelog',
        },
    ],
    '20230630': [
        {
            message:
                'Inventory filters, the contributor tooling roadmap, and the dChat knowledge base all matured in the November 1, 2025 release. Read the v3 changelog for the latest details.',
            href: '/docs/changelog/20251101',
            linkLabel: 'November 1, 2025 changelog',
        },
        {
            message:
                'The long-promised Contributors Guide is now live with workflow and testing guidance ' +
                'plus documentation checklists for new pull requests.',
            href: '/docs/contributors-guide',
            linkLabel: 'Contributors Guide',
        },
    ],
    '20230915': [
        {
            message:
                'Cloud Sync and cross-device backups arrived in the November 1, 2025 release. Check that changelog for setup instructions.',
            href: '/docs/changelog/20251101',
            linkLabel: 'November 1, 2025 changelog',
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
