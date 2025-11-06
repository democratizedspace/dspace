const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const padNumber = (value) => String(value).padStart(2, '0');

const formatDisplayDate = (value) => {
    if (typeof value !== 'string') {
        return '';
    }

    const normalized = value.trim();

    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(normalized)) {
        return normalized;
    }

    const [year, month, day] = normalized.split('-').map((part) => Number.parseInt(part, 10));

    if (!year || !month || !day) {
        return normalized;
    }

    const monthName = MONTH_NAMES[month - 1];

    if (!monthName) {
        return normalized;
    }

    return `${monthName} ${padNumber(day)}, ${year}`;
};

export const escapeHtml = (value = '') =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const normalizeNotes = (notes = []) => {
    if (!Array.isArray(notes)) {
        return [];
    }

    return notes
        .map((note) => {
            const summary = typeof note?.summary === 'string' ? note.summary.trim() : '';
            const href = typeof note?.href === 'string' ? note.href.trim() : '';
            const label = typeof note?.label === 'string' ? note.label.trim() : '';
            const added = typeof note?.added === 'string' ? note.added.trim() : '';

            if (!summary) {
                return null;
            }

            return {
                summary,
                href,
                label,
                added,
                addedDisplay: formatDisplayDate(added),
            };
        })
        .filter(Boolean);
};

export const buildChangelogNotesHtml = (notes = []) => {
    const normalized = normalizeNotes(notes);

    if (!normalized.length) {
        return '';
    }

    const itemsHtml = normalized
        .map((note) => {
            const dateSuffix = note.addedDisplay ? ` (${escapeHtml(note.addedDisplay)})` : '';
            const linkHtml = note.href
                ? ` <a href="${escapeHtml(note.href)}">${escapeHtml(note.label || 'Read the follow-up changelog')}</a>`
                : '';

            return `        <p><strong>Note${dateSuffix}:</strong> ${escapeHtml(note.summary)}${linkHtml}</p>`;
        })
        .join('\n');

    return `\n    <div class="changelog-notes" role="note" aria-label="Follow-up updates">\n${itemsHtml}\n    </div>\n`;
};
