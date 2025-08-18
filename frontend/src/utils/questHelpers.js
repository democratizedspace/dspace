export function isQuestTitleUnique(title, quests = [], ignoreId = null) {
    const lower = title.trim().toLowerCase();
    return !quests.some((q) => q.title.trim().toLowerCase() === lower && q.id !== ignoreId);
}
