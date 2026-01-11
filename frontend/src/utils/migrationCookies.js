import { detectV1CookieItems, detectV1CookieItemsFromEntries } from './legacySaveDetection';

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

export const getCookieItems = (cookie) => {
    return detectV1CookieItems(cookie).items;
};

export const getCookieItemsFromStore = (cookieStore) => {
    try {
        const cookies = cookieStore?.getAll?.() ?? [];
        return detectV1CookieItemsFromEntries(cookies).items;
    } catch (e) {
        console.warn('Failed to parse legacy cookies from Astro.cookies:', e);
        return [];
    }
};

export const getCookieKeysFromStore = (cookieStore) => {
    try {
        const cookies = cookieStore?.getAll?.() ?? [];
        return detectV1CookieItemsFromEntries(cookies).cookieKeys;
    } catch (e) {
        console.warn('Failed to list cookies from Astro.cookies:', e);
        return [];
    }
};

export const deleteCookie = (res, key) => {
    res.headers.append('Set-Cookie', `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`);
};
