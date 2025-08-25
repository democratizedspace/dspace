let register;

async function initMetrics(loader = () => import('prom-client')) {
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
