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
    const parsedCookie = parseCookie(cookie);
    return Object.keys(parsedCookie)
        .filter((key) => /^item-\d+$/.test(key) && parseFloat(parsedCookie[key]) > 0)
        .map((key) => {
            return {
                id: key.split('-')[1],
                count: parseFloat(parsedCookie[key]),
            };
        });
};

export const deleteCookie = (res, key) => {
    res.headers.append('Set-Cookie', `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`);
};
