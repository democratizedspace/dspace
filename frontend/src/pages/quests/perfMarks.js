const hasPerformanceApi = () =>
    typeof window !== 'undefined' &&
    typeof window.performance !== 'undefined' &&
    typeof window.performance.mark === 'function';

export const QUESTS_PERF_MARKS = {
    HYDRATION_START: 'quests:hydration-start',
    BUILTIN_VISIBLE: 'quests:builtin-visible',
    SNAPSHOT_READY: 'quests:snapshot-classification-ready',
    FULL_STATE_READY: 'quests:full-state-reconciled',
    CUSTOM_READY: 'quests:custom-merged',
};

export const markQuestPerf = (name) => {
    if (!hasPerformanceApi()) {
        return;
    }
    window.performance.mark(name);
};

export const measureQuestPerf = (name, startMark, endMark) => {
    if (
        !hasPerformanceApi() ||
        typeof window.performance.measure !== 'function' ||
        !startMark ||
        !endMark
    ) {
        return;
    }

    try {
        window.performance.measure(name, startMark, endMark);
    } catch {
        // Ignore missing-mark errors in non-deterministic test environments.
    }
};
