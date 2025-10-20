import process from 'node:process';

const defaultPort = 3000;
const port = Number.parseInt(process.env.PORT ?? '', 10) || defaultPort;
const host = process.env.HOST ?? '0.0.0.0';
const logLevel = process.env.LOG_LEVEL ?? 'info';

process.env.PORT = String(port);
process.env.HOST = host;
process.env.NODE_ENV = process.env.NODE_ENV ?? 'production';
process.env.ASTRO_LOG_LEVEL = process.env.ASTRO_LOG_LEVEL ?? logLevel;

const log = (level, message, context = {}) => {
    const entry = {
        ts: new Date().toISOString(),
        level,
        message,
        ...context,
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(entry));
};

log('info', 'starting_server', { host, port, logLevel });

let entryModule;
try {
    const bundleUrl = new URL('./dist/server/entry.mjs', import.meta.url);
    entryModule = await import(bundleUrl);
} catch {
    const fallbackUrl = new URL('../frontend/dist/server/entry.mjs', import.meta.url);
    entryModule = await import(fallbackUrl);
}

const running = await entryModule.startServer();

log('info', 'server_listening', {
    host: running.server.host,
    port: running.server.port,
});

let isShuttingDown = false;

const shutdown = async (signal) => {
    if (isShuttingDown) {
        return;
    }
    isShuttingDown = true;
    log('info', 'shutdown_signal', { signal });
    try {
        await running.server.stop();
        await running.done;
        log('info', 'shutdown_complete', { signal });
        process.exit(0);
    } catch (error) {
        log('error', 'shutdown_failed', { signal, error: error.message });
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

await running.done;
log('warn', 'server_stopped');
