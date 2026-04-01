export type FeatureFlagParseResult = {
    tokens: string[];
    overrides: Map<string, string>;
};

export function parseFeatureFlags(rawFlags?: string): FeatureFlagParseResult;

export function readBooleanOverride(value?: string): boolean | undefined;

export default parseFeatureFlags;
