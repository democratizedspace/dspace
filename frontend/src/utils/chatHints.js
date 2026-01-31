export const SAVE_SNAPSHOT_HINT_TEXT =
    'For inventory/progress questions, export/paste a save snapshot from /gamesaves.';

export const shouldShowSaveSnapshotHint = (text) => {
    if (!text) return false;
    return /\b(inventory|quests?|progress|achievements?|balance|wallet)\b/i.test(text);
};
