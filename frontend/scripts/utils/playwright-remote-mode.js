const isEnabled = (value) => value === '1';

const hasQuestsPerfBaseUrl = () => Boolean(process.env.QUESTS_PERF_BASE_URL?.trim());

export const REMOTE_PLAYWRIGHT_MODE_CONFIGS = Object.freeze([
    {
        name: 'remoteSmoke',
        isEnabled: ({ includeQuestsPerfBaseUrlSignal = false } = {}) =>
            isEnabled(process.env.REMOTE_SMOKE) ||
            // run-quests-perf.mjs sets REMOTE_SMOKE after setup-test-env.js runs,
            // so setup-test-env opts into this earlier QUESTS_PERF_BASE_URL signal.
            (includeQuestsPerfBaseUrlSignal && hasQuestsPerfBaseUrl()),
        useWebServerEnv: 'REMOTE_SMOKE_USE_WEBSERVER',
    },
    {
        name: 'remoteMigration',
        isEnabled: () => isEnabled(process.env.REMOTE_MIGRATION),
        useWebServerEnv: 'REMOTE_MIGRATION_USE_WEBSERVER',
    },
    {
        name: 'remoteCompletionistAwardIII',
        isEnabled: () => isEnabled(process.env.REMOTE_COMPLETIONIST_AWARD_III),
        useWebServerEnv: 'REMOTE_COMPLETIONIST_AWARD_III_USE_WEBSERVER',
    },
]);

export const getActiveRemotePlaywrightModes = ({ includeQuestsPerfBaseUrlSignal = false } = {}) =>
    REMOTE_PLAYWRIGHT_MODE_CONFIGS.filter(({ isEnabled }) =>
        isEnabled({ includeQuestsPerfBaseUrlSignal })
    );

export const isRemotePlaywrightModeWithoutWebServerOverride = ({
    includeQuestsPerfBaseUrlSignal = false,
} = {}) => {
    const activeRemoteModes = getActiveRemotePlaywrightModes({ includeQuestsPerfBaseUrlSignal });

    if (activeRemoteModes.length === 0) {
        return false;
    }

    return activeRemoteModes.every(({ useWebServerEnv }) => process.env[useWebServerEnv] !== '1');
};

export const shouldUsePlaywrightWebServer = ({ includeQuestsPerfBaseUrlSignal = false } = {}) =>
    !isRemotePlaywrightModeWithoutWebServerOverride({ includeQuestsPerfBaseUrlSignal });
