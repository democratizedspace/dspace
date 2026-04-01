export function registerOfflineWorker() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    const isAutomation = navigator.webdriver === true;

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

    const SW_REGISTRATION_OPTIONS = { updateViaCache: 'none' };
    const UPDATE_CHECK_SESSION_KEY = 'offlineWorkerUpdateChecked';

    function attachControllerReload() {
        let refreshing = false;

        const reloadPage = () => {
            if (refreshing) {
                return;
            }
            if (isAutomation) {
                return;
            }
            refreshing = true;
            console.info('Service worker update detected, reloading page');
            window.location.reload();
        };

        navigator.serviceWorker.addEventListener('controllerchange', reloadPage);
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
                console.info('Service worker update: state change', worker.state);
                if (worker.state === 'installed' && navigator.serviceWorker.controller) {
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

    function shouldRunUpdateCheck(registration) {
        if (!registration || typeof registration.update !== 'function') {
            return false;
        }

        const hasActiveController = !!navigator.serviceWorker.controller;
        const isInstalling = !!registration.installing;

        if (!hasActiveController && isInstalling) {
            return false;
        }

        try {
            if (window.sessionStorage?.getItem(UPDATE_CHECK_SESSION_KEY) === 'true') {
                return false;
            }
        } catch (error) {
            // Ignore storage access errors and continue with update attempt.
        }

        return true;
    }

    function markUpdateCheckAttempted() {
        try {
            window.sessionStorage?.setItem(UPDATE_CHECK_SESSION_KEY, 'true');
        } catch (error) {
            // Ignore storage access errors.
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
            if (attemptedReload || Date.now() - startTime > reloadWindowMs || isAutomation) {
                return;
            }

            fetch(target.href, { cache: 'no-cache' })
                .then((response) => {
                    if (
                        response.status === 404 &&
                        navigator.serviceWorker.controller &&
                        !isAutomation
                    ) {
                        attemptedReload = true;
                        window.location.reload();
                    }
                })
                .catch(() => {});
        };

        window.addEventListener('error', handleResourceError, true);

        const removeListener = () => window.removeEventListener('error', handleResourceError, true);

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
            .register('/service-worker.js', SW_REGISTRATION_OPTIONS)
            .then((registration) => {
                setupUpdateHandling(registration);
                installStylesheetRecovery();
                if (shouldRunUpdateCheck(registration)) {
                    markUpdateCheckAttempted();
                    registration.update().catch((error) => {
                        console.warn('Service worker update check failed:', error);
                    });
                }
            })
            .catch((error) => {
                console.warn('Service worker registration failed:', error);
            });
    });
}

if (typeof window !== 'undefined') {
    registerOfflineWorker();
}
