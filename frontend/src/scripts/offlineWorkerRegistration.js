export function registerOfflineWorker() {
    if (!('serviceWorker' in navigator)) {
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

    const shouldRegister = () => {
        const envEnabled =
            typeof import.meta !== 'undefined'
                ? import.meta.env?.PUBLIC_ENABLE_SERVICE_WORKER
                : undefined;

        if (envEnabled === 'false') {
            return false;
        }

        if (typeof window !== 'undefined' && window.__DS_DISABLE_SW === true) {
            return false;
        }

        return true;
    };

    function attachControllerReload() {
        let refreshing = false;
        const handleControllerChange = () => {
            if (refreshing) {
                return;
            }
            refreshing = true;
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    }

    function triggerUpdate(registration) {
        const { waiting } = registration || {};
        if (!waiting) {
            return;
        }

        waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    function setupUpdateHandling(registration) {
        if (!registration) {
            return;
        }

        attachControllerReload();

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

    function installStylesheetRecovery() {
        if (!navigator.serviceWorker.controller) {
            return;
        }

        const startTime = Date.now();
        const reloadWindowMs = 30_000;
        let attemptedReload = false;

        const handleResourceError = (event) => {
            const target = event?.target;
            const isStylesheet =
                target instanceof HTMLLinkElement && target.rel === 'stylesheet' && target.href;

            if (!isStylesheet) {
                return;
            }

            // A single reload is expected to refresh all stylesheet URLs, so additional
            // failures after the first attempt are allowed to fall through.
            if (attemptedReload || Date.now() - startTime > reloadWindowMs) {
                return;
            }

            fetch(target.href, { cache: 'no-cache' })
                .then((response) => {
                    if (response.status === 404 && navigator.serviceWorker.controller) {
                        attemptedReload = true;
                        window.location.reload();
                    }
                })
                .catch(() => {});
        };

        window.addEventListener('error', handleResourceError, true);
    }

    window.addEventListener('load', async () => {
        if (!shouldRegister()) {
            console.info('Offline worker disabled via environment flag.');
            return;
        }

        if (!(await shouldEnableOfflineWorker())) {
            console.info('Offline worker disabled via runtime config.');
            return;
        }

        navigator.serviceWorker
            .register('/service-worker.js')
            .then((registration) => {
                setupUpdateHandling(registration);
                installStylesheetRecovery();
            })
            .catch((error) => {
                console.warn('Service worker registration failed:', error);
            });
    });
}
