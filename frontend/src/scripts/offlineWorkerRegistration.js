const STYLESHEET_RETRY_WINDOW_MS = 15000;

function isServiceWorkerEnabledByEnv() {
    if (typeof process !== 'undefined' && process?.env) {
        const env = process.env;
        if (env.DSPACE_OFFLINE_WORKER_DISABLED === 'true') {
            return false;
        }

        if (env.NODE_ENV === 'test' && env.DSPACE_OFFLINE_WORKER_ENABLED !== 'true') {
            return false;
        }
    }

    return true;
}

export function installStylesheet404Recovery({ reload = () => window.location.reload() } = {}) {
    if (typeof window === 'undefined') {
        return;
    }

    let attemptedRecovery = false;
    const startedAt = Date.now();

    const maybeRecover = async (event) => {
        const target = event?.target;
        const isStylesheet =
            target instanceof HTMLLinkElement && target.rel === 'stylesheet' && target.href;

        if (!isStylesheet || attemptedRecovery) {
            return;
        }

        if (!navigator.serviceWorker?.controller) {
            return;
        }

        if (Date.now() - startedAt > STYLESHEET_RETRY_WINDOW_MS) {
            return;
        }

        try {
            const response = await fetch(target.href, { cache: 'no-store' });
            if (response.status !== 404) {
                return;
            }
        } catch (error) {
            console.warn('Stylesheet recovery fetch failed:', error);
            return;
        }

        attemptedRecovery = true;
        window.removeEventListener('error', maybeRecover, true);
        reload();
    };

    window.addEventListener('error', maybeRecover, true);
}

export function registerOfflineWorker() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    if (!isServiceWorkerEnabledByEnv()) {
        return;
    }

    const shouldEnableOfflineWorker = async () => {
        try {
            const response = await fetch('/config.json', {
                cache: 'no-cache',
                headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
                throw new Error(`Unexpected status ${response.status}`);
            }

            const config = await response.json();
            return config?.offlineWorker?.enabled !== false;
        } catch (error) {
            console.warn(
                'Failed to load runtime config, enabling offline worker by default:',
                error
            );
            return true;
        }
    };

    function triggerUpdate(registration) {
        const { waiting } = registration || {};
        if (!waiting) {
            return;
        }

        waiting.postMessage({ type: 'SKIP_WAITING' });

        let refreshing = false;
        const handleControllerChange = () => {
            if (refreshing) {
                return;
            }
            refreshing = true;
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange, {
            once: true,
        });
    }

    function setupUpdateHandling(registration) {
        if (!registration) {
            return;
        }

        if (registration.waiting) {
            triggerUpdate(registration);
            return;
        }

        const listen = (worker) => {
            if (!worker) {
                return;
            }

            worker.addEventListener(
                'statechange',
                () => {
                    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                        triggerUpdate(registration);
                    }
                },
                { once: true }
            );
        };

        if (registration.installing) {
            listen(registration.installing);
        } else {
            registration.addEventListener('updatefound', () => {
                listen(registration.installing);
            });
        }
    }

    window.addEventListener('load', async () => {
        installStylesheet404Recovery();

        if (!(await shouldEnableOfflineWorker())) {
            console.info('Offline worker disabled via runtime config.');
            return;
        }

        navigator.serviceWorker
            .register('/service-worker.js')
            .then((registration) => {
                setupUpdateHandling(registration);
            })
            .catch((error) => {
                console.warn('Service worker registration failed:', error);
            });
    });
}
