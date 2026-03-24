let register;

const defaultLoader = () => import('prom-client');

async function initMetrics(loader = defaultLoader) {
    try {
        const { Registry, collectDefaultMetrics } = await loader();
        register = new Registry();
        collectDefaultMetrics({ register });
    } catch {
        register = {
            contentType: 'text/plain',
            metrics: async () => '# metrics unavailable\n',
        };
    }
}

await initMetrics();

export { register, initMetrics };
