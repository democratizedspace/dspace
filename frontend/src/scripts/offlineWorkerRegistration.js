const shouldEnableOfflineWorker = async () => {
        try {
                const response = await fetch('/config.json', {
                        cache: 'no-cache',
                        headers: {
                                Accept: 'application/json',
                        },
                });

                if (!response.ok) {
                        throw new Error(`Unexpected status ${response.status}`);
                }

                const config = await response.json();
                return config?.offlineWorker?.enabled !== false;
        } catch (error) {
                console.warn('Failed to load runtime config, enabling offline worker by default:', error);
                return true;
        }
};

function triggerUpdate(registration) {
        const waiting = registration?.waiting;
        if (!waiting) return;

        waiting.postMessage({ type: 'SKIP_WAITING' });

        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                refreshing = true;
                window.location.reload();
        });
}

function setupUpdateHandling(registration) {
        if (!registration) return;

        if (registration.waiting) {
                triggerUpdate(registration);
                return;
        }

        const listen = (worker) => {
                if (!worker) return;
                worker.addEventListener('statechange', () => {
                        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                                triggerUpdate(registration);
                        }
                });
        };

        if (registration.installing) {
                listen(registration.installing);
        } else {
                registration.addEventListener('updatefound', () => {
                        listen(registration.installing);
                });
        }
}

export function registerOfflineWorker() {
        if (!('serviceWorker' in navigator)) return;

        window.addEventListener('load', async () => {
                        if (!(await shouldEnableOfflineWorker())) {
                                console.info('Offline worker disabled via runtime config.');
                                return;
                        }

                        navigator.serviceWorker
                                .register('/service-worker.js')
                                .then((registration) => setupUpdateHandling(registration))
                                .catch((error) => {
                                        console.warn('Service worker registration failed:', error);
                                });
        });
}
