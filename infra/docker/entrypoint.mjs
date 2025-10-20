import process from 'node:process';

const shutdownSignals = ['SIGTERM', 'SIGINT'];
const log = (level, message, extra = {}) => {
    const payload = {
        level,
        msg: message,
        timestamp: new Date().toISOString(),
        ...extra,
    };
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload));
};

process.env.PORT ||= '8080';
process.env.HOST ||= '0.0.0.0';

const { startServer } = await import('./dist/server/entry.mjs');
const { server } = await startServer();
log('info', 'server.started', { host: server.host, port: server.port });

let shuttingDown = false;
const stop = async (signal) => {
    if (shuttingDown) {
        return;
    }
    shuttingDown = true;
    log('info', 'server.shutdown.initiated', { signal });
    try {
        await server.stop();
        await server.closed();
        log('info', 'server.shutdown.complete');
        process.exit(0);
    } catch (error) {
        log('error', 'server.shutdown.failed', { error: error instanceof Error ? error.message : String(error) });
        process.exit(1);
    }
};

shutdownSignals.forEach((signal) => {
    process.on(signal, () => {
        void stop(signal);
    });
});

process.on('uncaughtException', (error) => {
    log('error', 'server.uncaught-exception', { error: error instanceof Error ? error.message : String(error) });
});

process.on('unhandledRejection', (reason) => {
    log('error', 'server.unhandled-rejection', { reason: reason instanceof Error ? reason.message : String(reason) });
});

await server.closed();
