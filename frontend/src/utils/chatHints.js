export const SAVE_SNAPSHOT_HINT_TEXT =
    'For inventory/progress questions, export/paste a save snapshot from /gamesaves.';

const saveSnapshotHintPattern = /\b(inventory|quests?|progress|achievements?|balance|wallet)\b/i;

export const shouldShowSaveSnapshotHint = (text) => {
    if (!text) return false;
    return saveSnapshotHintPattern.test(text);
};
