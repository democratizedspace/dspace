const FEATURE_DETECTORS = {
    link: (content) => /<a\s[^>]*href=|(?<!!)\[[^\]]+]\([^\s)]+\)/i.test(content),
    image: (content) => /<img\s[^>]*src=|!\[[^\]]*]\([^\s)]+\)/i.test(content),
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
