/**
 * Parse a comma-delimited feature flag string into normalized tokens and overrides.
 * Empty tokens are discarded and whitespace is trimmed so env vars can contain spaces.
 */
export function parseFeatureFlags(rawFlags) {
    const tokens = (rawFlags || '')
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean);

    const overrides = new Map();

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

/**
 * Interpret a raw string as a boolean override if it matches a known truthy or falsy token.
 */
export function readBooleanOverride(value) {
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

export default parseFeatureFlags;
