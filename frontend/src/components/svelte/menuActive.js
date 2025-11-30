import { isBrowser } from '../../utils/ssr.js';

const normalizePathname = (value) => {
    if (typeof value !== 'string') {
        return '';
    }

    const [path] = value.split('?');
    if (!path) {
        return '';
    }

    if (path.length > 1 && path.endsWith('/')) {
        return path.slice(0, -1);
    }

    return path;
};

const normalizeHref = (href) => {
    if (typeof href !== 'string') {
        return '';
    }

    if (href.startsWith('http://') || href.startsWith('https://')) {
        try {
            return normalizePathname(new URL(href).pathname);
        } catch {
            return '';
        }
    }

    return normalizePathname(href);
};

const matchesTarget = (current, target) => {
    if (current === target) {
        return true;
    }

    if (current.startsWith(`${target}/`)) {
        return true;
    }

    if (current.endsWith(target)) {
        return true;
    }

    return current.includes(`${target}/`);
};

export const isMenuItemActive = (pathname, item) => {
    const target = normalizeHref(item?.href);
    const current = normalizePathname(
        typeof pathname === 'string' ? pathname : isBrowser ? window.location.pathname : ''
    );

    if (!target || !current) {
        return false;
    }

    if (target === '/') {
        return current === '/';
    }

    return matchesTarget(current, target);
};
