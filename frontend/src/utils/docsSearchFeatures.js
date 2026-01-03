const FEATURE_DETECTORS = {
    // The negative lookbehind `(?<!!)` ensures the `[` is not immediately preceded by `!`,
    // so we match markdown links `[text](url)` but not image syntax `![alt](url)`.
    link: (content) => /<a\s[^>]*href=|(?<!!)\[[^\]]+]\([^\s)]+\)/.test(content),
    image: (content) => /<img\s[^>]*src=|!\[[^\]]*]\([^\s)]+\)/.test(content),
};

const normalizeFeatureName = (feature = '') => feature.toLowerCase().trim();

const normalizeFeatures = (features = []) => {
    const normalized = features.map(normalizeFeatureName).filter(Boolean);
    return Array.from(new Set(normalized));
};

export const detectDocFeatures = (content = '') => {
    if (typeof content !== 'string' || !content.trim()) {
        return [];
    }

    const detected = Object.entries(FEATURE_DETECTORS)
        .filter(([, detector]) => detector(content))
        .map(([feature]) => feature);

    return normalizeFeatures(detected);
};

export { FEATURE_DETECTORS, normalizeFeatureName, normalizeFeatures };
