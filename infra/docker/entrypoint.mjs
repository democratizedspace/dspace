import process from 'node:process';

const log = (level, message, fields = {}) => {
  const payload = {
    level,
    msg: message,
    time: new Date().toISOString(),
    ...fields,
  };
  console.log(JSON.stringify(payload));
};

let shutdownRequested = false;
let metricsServer;

async function shutdown(signal) {
  if (shutdownRequested) {
    return;
  }
  shutdownRequested = true;
  log('info', 'Shutdown signal received', { signal });
  try {
    if (metricsServer) {
      await new Promise((resolve, reject) => {
        metricsServer.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
      metricsServer = undefined;
    }
    log('info', 'Server stopped cleanly', { signal });
    process.exit(0);
  } catch (error) {
    log('error', 'Server shutdown failed', {
      signal,
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

['SIGTERM', 'SIGINT'].forEach((signal) => {
  process.on(signal, () => {
    shutdown(signal).catch((error) => {
      log('error', 'Unhandled shutdown error', {
        signal,
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    });
  });
});

async function main() {
  if (process.env.DSPACE_ENABLE_METRICS === '1') {
    const metricsPort = Number.parseInt(process.env.DSPACE_METRICS_PORT ?? '', 10);
    const port = Number.isInteger(metricsPort) ? metricsPort : undefined;
    try {
      // Lazy import metrics module only when needed to avoid prom-client resolution
      // errors when metrics are disabled
      const { startMetricsServer } = await import('./metrics.mjs');
      metricsServer = startMetricsServer({ port });
      const address = metricsServer.address();
      log('info', 'Metrics server enabled', {
        port: typeof address === 'object' && address ? address.port : port ?? 9464,
      });
    } catch (error) {
      log('error', 'Failed to start metrics server', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Import the Astro server entry - in standalone mode, this auto-starts the server
  // when the module is loaded, so we don't need to call startServer() ourselves
  await import('./dist/server/entry.mjs');

  log('info', 'DSPACE server started', {
    host: process.env.HOST || '0.0.0.0',
    port: process.env.PORT || 8080,
    featureFlags: process.env.DSPACE_FEATURE_FLAGS || '',
  });
}

main().catch((error) => {
  log('error', 'Failed to start DSPACE server', {
    error:
      error instanceof Error ? error.stack || error.message : String(error),
  });
  process.exit(1);
});
