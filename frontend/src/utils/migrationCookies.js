export const parseCookie = (cookie) => {
    try {
        return cookie.split(/[;] */).reduce(function (result, pairStr) {
            const arr = pairStr.split('=');
            if (arr.length === 2) {
                result[arr[0]] = arr[1];
            }
            return result;
        }, {});
    } catch (e) {
        return {};
    }
};

const isLegacyItemCookie = (key, value) =>
    /^item-\d+$/.test(key) && !Number.isNaN(parseFloat(value)) && parseFloat(value) > 0;

export const getCookieItems = (cookie) => {
    const parsedCookie = parseCookie(cookie);
    return Object.keys(parsedCookie)
        .filter((key) => isLegacyItemCookie(key, parsedCookie[key]))
        .map((key) => {
            return {
                id: key.split('-')[1],
                count: parseFloat(parsedCookie[key]),
            };
        });
};

export const getCookieItemsFromStore = (cookieStore) => {
    try {
        const cookies = cookieStore?.getAll?.() ?? [];
        return cookies
            .filter(({ name, value }) => isLegacyItemCookie(name, value))
            .map(({ name, value }) => ({
                id: name.split('-')[1],
                count: parseFloat(value),
            }));
    } catch (e) {
        console.warn('Failed to parse legacy cookies from Astro.cookies:', e);
        return [];
    }
};

export const getCookieKeysFromStore = (cookieStore) => {
    try {
        const cookies = cookieStore?.getAll?.() ?? [];
        return cookies.map(({ name }) => name);
    } catch (e) {
        console.warn('Failed to list cookies from Astro.cookies:', e);
        return [];
    }
};

export const deleteCookie = (res, key) => {
    res.headers.append('Set-Cookie', `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`);
};
