import client from 'prom-client';
import http from 'http';

const METRICS_PATH = '/metrics';

function createMetricsHandler() {
  return async function handleMetrics(req, res) {
    if (!req?.url || req.method !== 'GET') {
      return false;
    }

    const [pathname] = req.url.split('?');
    if (pathname !== METRICS_PATH) {
      return false;
    }

    try {
      const metrics = await client.register.metrics();
      res.statusCode = 200;
      res.setHeader('Content-Type', client.register.contentType);
      res.setHeader('Cache-Control', 'no-store');
      res.end(metrics);
    } catch (error) {
      res.statusCode = 500;
      res.end('metrics unavailable');
    }

    return true;
  };
}

export function startMetricsServer({ port = 9464, server } = {}) {
  client.collectDefaultMetrics();
  const handleMetrics = createMetricsHandler();

  if (server) {
    const existingListeners = server.listeners('request');
    server.removeAllListeners('request');

    const wrappedListener = async (req, res) => {
      const handled = await handleMetrics(req, res);
      if (handled) {
        return;
      }
      for (const listener of existingListeners) {
        listener.call(server, req, res);
      }
    };

    server.on('request', wrappedListener);
    console.log('metrics on existing server');

    return {
      close: async () => {
        server.removeListener('request', wrappedListener);
        for (const listener of existingListeners) {
          server.on('request', listener);
        }
      },
    };
  }

  const metricsServer = http.createServer(async (req, res) => {
    const handled = await handleMetrics(req, res);
    if (!handled) {
      res.statusCode = 404;
      res.end();
    }
  });

  metricsServer.listen(port, '0.0.0.0', () => {
    console.log('metrics on', port);
  });

  return {
    close: async () =>
      new Promise((resolve, reject) => {
        metricsServer.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
