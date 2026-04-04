const isPerformanceSupported = () =>
    typeof performance !== 'undefined' &&
    typeof performance.mark === 'function' &&
    typeof performance.measure === 'function';

export const QUEST_PERF_MARKS = {
    HYDRATION_START: 'quests:hydration-start',
    BUILTIN_VISIBLE: 'quests:builtin-visible',
    SNAPSHOT_READY: 'quests:snapshot-classification-ready',
    FULL_RECONCILED: 'quests:full-reconciliation-ready',
    CUSTOM_READY: 'quests:custom-merge-ready',
};

export const QUEST_PERF_MEASURES = {
    BUILTIN_VISIBLE: 'quests:time-to-builtin-visible',
    SNAPSHOT_READY: 'quests:time-to-snapshot-ready',
    FULL_RECONCILED: 'quests:time-to-full-reconciliation',
    CUSTOM_READY: 'quests:time-to-custom-merge',
};

export const markQuestPerf = (name) => {
    if (!isPerformanceSupported()) {
        return;
    }
    performance.mark(name);
};

export const measureQuestPerf = (name, startMark, endMark) => {
    if (!isPerformanceSupported()) {
        return;
    }

    const marks = performance.getEntriesByType('mark');
    const hasStart = marks.some((entry) => entry.name === startMark);
    const hasEnd = marks.some((entry) => entry.name === endMark);

    if (!hasStart || !hasEnd) {
        return;
    }

    performance.measure(name, startMark, endMark);
};
