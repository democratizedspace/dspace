export interface ChangelogNote {
    html: string;
}

export type ChangelogNotes = Record<string, ChangelogNote[]>;

export const CHANGELOG_NOTES: ChangelogNotes = {
    '20221019': [
        {
            html: 'Process material reservations shipped in the <a href="#20251101">November 1, 2025 changelog</a>, closing the loop on this beta caveat.',
        },
    ],
    '20221031': [
        {
            html: 'The expanded docs library teased here arrived in the <a href="#20230630">June 30, 2023 changelog</a>.',
        },
    ],
    '20221210': [
        {
            html: 'Sustainable solar and wind generation landed in the <a href="#20230101">January 1, 2023 changelog</a>.',
        },
        {
            html: 'The dCarbon to dOffset exchange shipped with the <a href="#20230131">January 31, 2023 changelog</a>.',
        },
    ],
    '20230101': [
        {
            html: 'Process material reservations shipped in the <a href="#20251101">November 1, 2025 changelog</a>.',
        },
    ],
    '20230630': [
        {
            html: 'GPT-powered dChat companions launched in the <a href="#20251101">November 1, 2025 changelog</a>.',
        },
    ],
    '20230915': [
        {
            html: 'Cloud Sync backups shipped in the <a href="#20251101">November 1, 2025 changelog</a>.',
        },
    ],
};

export const getChangelogNotes = (slug: string): ChangelogNote[] => CHANGELOG_NOTES[slug] ?? [];
