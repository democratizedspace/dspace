function isServiceWorkerAllowed() {
    const envFlag =
        typeof process !== 'undefined' ? process.env?.DSPACE_ENABLE_SERVICE_WORKER : undefined;
    if (envFlag === '0' || envFlag === 'false') {
        return false;
    }

    const publicFlag =
        typeof import.meta !== 'undefined'
            ? import.meta.env?.PUBLIC_ENABLE_SERVICE_WORKER
            : undefined;
    if (publicFlag === '0' || publicFlag === 'false') {
        return false;
    }

    return true;
}

export function registerOfflineWorker() {
    if (!('serviceWorker' in navigator)) {
        return;
    }

    if (!isServiceWorkerAllowed()) {
        console.info('Offline worker disabled via environment flag.');
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
