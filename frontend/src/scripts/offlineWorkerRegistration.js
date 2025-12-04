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

        const reloadPage = () => {
            if (refreshing) {
                return;
            }
            refreshing = true;
            console.info('Service worker update detected, reloading page');
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener(
            'controllerchange',
            reloadPage
        );
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event?.data?.type === 'DS_FORCE_RELOAD') {
                reloadPage();
            }
        });

        return reloadPage;
    }

    function triggerUpdate(registration, reloadPage) {
        const { waiting } = registration || {};
        if (!waiting) {
            return;
        }

        waiting.postMessage({ type: 'SKIP_WAITING' });

        // Ensure the page reloads even if the controllerchange event does not
        // fire as expected after skipWaiting().
        setTimeout(reloadPage, 50);
    }

    function setupUpdateHandling(registration) {
        if (!registration) {
            return;
        }

        const reloadPage = attachControllerReload();

        if (registration.waiting) {
            console.info('Service worker update: waiting worker detected');
            triggerUpdate(registration, reloadPage);
            reloadPage();
            return;
        }

        const listen = (worker) => {
            if (!worker) {
                return;
            }

            worker.addEventListener('statechange', () => {
                console.info(
                    'Service worker update: state change',
                    worker.state
                );
                if (
                    worker.state === 'installed' &&
                    navigator.serviceWorker.controller
                ) {
                    triggerUpdate(registration, reloadPage);
                    reloadPage();
                }
            });
        };

        if (registration.installing) {
            console.info('Service worker update: installing worker detected');
            listen(registration.installing);
        } else {
            registration.addEventListener('updatefound', () => {
                console.info('Service worker update: update found');
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
                target instanceof HTMLLinkElement &&
                target.rel === 'stylesheet' &&
                target.href;

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
                    if (
                        response.status === 404 &&
                        navigator.serviceWorker.controller
                    ) {
                        attemptedReload = true;
                        window.location.reload();
                    }
                })
                .catch(() => {});
        };

        window.addEventListener('error', handleResourceError, true);

        const removeListener = () =>
            window.removeEventListener('error', handleResourceError, true);

        setTimeout(removeListener, reloadWindowMs);

        return () => {
            removeListener();
        };
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
