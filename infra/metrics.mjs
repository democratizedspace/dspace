import http from 'node:http';
import client from 'prom-client';

export function startMetricsServer({ port = 9464 } = {}) {
  client.collectDefaultMetrics();
  const server = http.createServer(async (req, res) => {
    if (req.url !== '/metrics') {
      res.statusCode = 404;
      res.end();
      return;
    }

    res.setHeader('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  });

  server.listen(port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log('metrics on', port);
  });

  return server;
}
