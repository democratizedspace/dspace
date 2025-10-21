import process from 'node:process';
import { startMetricsServer } from '../metrics.mjs';
import { startServer } from './dist/server/entry.mjs';

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
let control;
let donePromise;
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
    if (control?.stop) {
      await control.stop();
    }
    if (donePromise) {
      await donePromise;
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
  const { server, done } = await startServer();
  control = server;
  donePromise = done;
  const host = server.host ?? '0.0.0.0';
  const port = server.port;
  log('info', 'DSPACE server started', {
    host,
    port,
    featureFlags: process.env.DSPACE_FEATURE_FLAGS || '',
  });
  await done;
  log('info', 'HTTP server closed');
}

main().catch((error) => {
  log('error', 'Failed to start DSPACE server', {
    error:
      error instanceof Error ? error.stack || error.message : String(error),
  });
  process.exit(1);
});
