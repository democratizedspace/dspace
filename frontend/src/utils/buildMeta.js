const readEnvValue = (key) => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) {
        return import.meta.env[key];
    }
    if (typeof process !== 'undefined' && process.env?.[key]) {
        return process.env[key];
    }
    return undefined;
};

export const resolveAppBuildSha = () => {
    const envSha = readEnvValue('VITE_GIT_SHA');
    const normalized = String(envSha || '').trim();
    return normalized || 'unknown';
};
