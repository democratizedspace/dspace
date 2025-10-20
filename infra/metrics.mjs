import http from 'http';
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
    console.log('metrics on', port);
  });

  return server;
}
