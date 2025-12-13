export type FeatureFlagParseResult = {
    tokens: string[];
    overrides: Map<string, string>;
};

export function parseFeatureFlags(rawFlags: string | undefined): FeatureFlagParseResult {
    const tokens = (rawFlags || '')
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean);

    const overrides = new Map<string, string>();

    for (const token of tokens) {
        const equalsIndex = token.indexOf('=');
        if (equalsIndex === -1) continue;

        const key = token.slice(0, equalsIndex).trim();
        const value = token.slice(equalsIndex + 1).trim();

        if (key) {
            overrides.set(key, value);
        }
    }

    return { tokens, overrides };
}

export function readBooleanOverride(value: string | undefined): boolean | undefined {
    if (value === undefined) return undefined;

    const normalized = value.trim().toLowerCase();

    if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) {
        return true;
    }

    if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) {
        return false;
    }

    return undefined;
}
