export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value) => {
    if (value === null || value === undefined) return false;
    const trimmed = String(value).trim();
    if (!trimmed) return false;
    return UUID_REGEX.test(trimmed);
};
