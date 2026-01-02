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

export const clearItemCookies = () => {
    if (typeof document === 'undefined') return;

    const cookies = document.cookie ? document.cookie.split(';') : [];
    const itemCookieNames = cookies
        .map((cookie) => cookie.split('=')[0]?.trim())
        .filter((name) => name && /^item-\d+$/.test(name));

    const candidatePaths = ['/'];
    if (typeof location !== 'undefined' && location.pathname) {
        const segments = location.pathname.split('/').filter(Boolean);
        let currentPath = '';
        segments.forEach((segment) => {
            currentPath += `/${segment}`;
            candidatePaths.push(currentPath);
        });
    }

    const candidateDomains = [undefined];
    if (typeof location !== 'undefined' && location.hostname) {
        const host = location.hostname;
        const parts = host.split('.').filter(Boolean);
        candidateDomains.push(host, `.${host}`);
        for (let i = 0; i < parts.length - 1; i++) {
            const domain = parts.slice(i).join('.');
            candidateDomains.push(domain, `.${domain}`);
        }
    }

    itemCookieNames.forEach((name) => {
        candidatePaths.forEach((path) => {
            candidateDomains.forEach((domain) => {
                let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
                if (domain) {
                    cookieString += `; domain=${domain}`;
                }
                document.cookie = cookieString;
            });
        });
    });
};
