const RELOAD_FLAG = 'dspace-stylesheet-reloaded';
const DEFAULT_ERROR_WINDOW_MS = 30_000;

function isServiceWorkerControllingPage() {
    return Boolean(typeof navigator !== 'undefined' && navigator.serviceWorker?.controller);
}

function shouldReload() {
    return sessionStorage.getItem(RELOAD_FLAG) !== '1';
}

function markReloadAttempted() {
    sessionStorage.setItem(RELOAD_FLAG, '1');
}

function isStylesheetLink(target) {
    if (!target || typeof target !== 'object') {
        return false;
    }

    const tagName = typeof target.tagName === 'string' ? target.tagName.toLowerCase() : '';
    if (tagName !== 'link') {
        return false;
    }

    const rel = typeof target.rel === 'string' ? target.rel.toLowerCase() : '';
    if (rel !== 'stylesheet') {
        return false;
    }

    const href =
        typeof target.href === 'string'
            ? target.href
            : typeof target.getAttribute === 'function'
            ? target.getAttribute('href')
            : null;

    return Boolean(href);
}

export function setupStylesheetRecovery({ errorWindowMs = DEFAULT_ERROR_WINDOW_MS } = {}) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return undefined;
    }

    const startedAt = Date.now();

    const handler = async (event) => {
        if (!shouldReload()) {
            return;
        }

        if (!isServiceWorkerControllingPage()) {
            return;
        }

        if (Date.now() - startedAt > errorWindowMs) {
            return;
        }

        const target = event?.target;
        if (!isStylesheetLink(target)) {
            return;
        }

        const href = target.href || target.getAttribute?.('href');
        if (!href) {
            return;
        }

        try {
            const response = await fetch(href, { cache: 'no-cache' });
            if (response.status !== 404) {
                return;
            }
        } catch (error) {
            // Network failure still qualifies for recovery when a SW controls the page.
        }

        markReloadAttempted();
        window.location.reload();
    };

    window.addEventListener('error', handler, true);

    return () => window.removeEventListener('error', handler, true);
}
