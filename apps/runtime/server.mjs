import process from 'node:process';

const log = (level, msg, fields = {}) => {
    const entry = JSON.stringify({ level, msg, ...fields });
    if (level === 'error') {
        console.error(entry);
    } else {
        console.log(entry);
    }
};

const ensureRuntimeEnv = () => {
    const host = process.env.HOST ?? '0.0.0.0';
    const port = Number.parseInt(process.env.PORT ?? '8080', 10);
    process.env.HOST = host;
    process.env.PORT = String(port);
    process.env.NODE_ENV = process.env.NODE_ENV ?? 'production';
    return { host, port };
};

const bootstrap = async () => {
    const { startServer } = await import('../../frontend/dist/server/entry.mjs');
    const { host, port } = ensureRuntimeEnv();
    const serverControl = await startServer();

    log('info', 'server.start', { host, port });

    let shuttingDown = false;

    const shutdown = async (signal) => {
        if (shuttingDown) {
            return;
        }
        shuttingDown = true;
        log('info', 'server.shutdown.begin', { signal });
        try {
            await serverControl.server.stop();
            await serverControl.done;
            log('info', 'server.shutdown.complete', { signal });
            process.exit(0);
        } catch (error) {
            log('error', 'server.shutdown.error', {
                signal,
                error: error instanceof Error ? error.message : String(error),
            });
            process.exit(1);
        }
    };

    const signals = ['SIGTERM', 'SIGINT'];
    for (const signal of signals) {
        process.on(signal, () => {
            void shutdown(signal);
        });
    }

    process.on('unhandledRejection', (reason) => {
        log('error', 'unhandledRejection', {
            error: reason instanceof Error ? reason.message : String(reason),
        });
    });

    process.on('uncaughtException', (error) => {
        log('error', 'uncaughtException', { error: error.message });
        void shutdown('uncaughtException');
    });

    serverControl.done.then(() => {
        log('info', 'server.stop', {});
    }).catch((error) => {
        log('error', 'server.stop.error', {
            error: error instanceof Error ? error.message : String(error),
        });
    });
};

bootstrap().catch((error) => {
    log('error', 'server.start.error', {
        error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
});
