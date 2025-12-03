export function registerOfflineWorker() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    const metaEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined;
    const processEnv = typeof process !== 'undefined' ? process.env : {};

    const isTestEnv = (metaEnv?.MODE ?? processEnv?.NODE_ENV) === 'test' || processEnv?.VITEST;
    const isDisabledByEnv =
        metaEnv?.PUBLIC_DISABLE_SERVICE_WORKER === 'true' ||
        processEnv?.PUBLIC_DISABLE_SERVICE_WORKER === 'true';
    const isEnabledOverride =
        metaEnv?.PUBLIC_ENABLE_SERVICE_WORKER === 'true' ||
        processEnv?.PUBLIC_ENABLE_SERVICE_WORKER === 'true';

    if ((isTestEnv && !isEnabledOverride) || (isDisabledByEnv && !isEnabledOverride)) {
        console.info('Offline worker disabled via environment overrides.');
        return;
    }

    let hasReloaded = false;

    const reloadOnce = () => {
        if (hasReloaded) {
            return;
        }

        hasReloaded = true;
        window.location.reload();
    };

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

    function setupStylesheetFallback() {
        const startedAt = Date.now();

        const handleStylesheetError = async (event) => {
            if (hasReloaded || !navigator.serviceWorker.controller) {
                return;
            }

            const { target } = event;
            if (!target || !(target instanceof HTMLLinkElement)) {
                return;
            }

            if (target.rel !== 'stylesheet' || !target.href) {
                return;
            }

            if (Date.now() - startedAt > 15000) {
                return;
            }

            try {
                const response = await fetch(target.href, { cache: 'no-cache' });
                if (response?.status !== 404) {
                    return;
                }
            } catch (error) {
                console.warn('Stylesheet validation failed after load:', error);
            }

            window.removeEventListener('error', handleStylesheetError, true);
            reloadOnce();
        };

        window.addEventListener('error', handleStylesheetError, true);

        return () => window.removeEventListener('error', handleStylesheetError, true);
    }

    function triggerUpdate(registration) {
        const { waiting } = registration || {};
        if (!waiting || !navigator.serviceWorker.controller) {
            return;
        }

        waiting.postMessage({ type: 'SKIP_WAITING' });

        const handleControllerChange = () => {
            navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
            reloadOnce();
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
        if (!(await shouldEnableOfflineWorker())) {
            console.info('Offline worker disabled via runtime config.');
            return;
        }

        const cleanupStylesheetError = setupStylesheetFallback();

        navigator.serviceWorker
            .register('/service-worker.js')
            .then((registration) => {
                setupUpdateHandling(registration);
            })
            .catch((error) => {
                console.warn('Service worker registration failed:', error);
                cleanupStylesheetError();
            });
    });
}
