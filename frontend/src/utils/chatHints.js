export const SAVE_SNAPSHOT_HINT_TEXT =
    'For inventory/progress questions, export/paste a save snapshot from /gamesaves.';

const SAVE_SNAPSHOT_HINT_REGEX = /\b(inventory|quests?|progress|achievements?|balance|wallet)\b/i;

export const shouldShowSaveSnapshotHint = (text) => {
    if (typeof text !== 'string') return false;
    return SAVE_SNAPSHOT_HINT_REGEX.test(text);
};
