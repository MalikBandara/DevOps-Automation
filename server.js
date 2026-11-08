import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { products } from './src/products.js';

const publicDirectory = fileURLToPath(new URL('./public/', import.meta.url));
const routes = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
};

function json(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}

export function createServer() {
  return http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      return json(response, 405, { error: 'Method not allowed' });
    }
    try {
      const url = new URL(request.url, 'http://localhost');
      if (url.pathname === '/health') return json(response, 200, { status: 'ok' });
      if (url.pathname === '/api/products') return json(response, 200, products);
      if (url.pathname === '/total') {
        const rawPrice = url.searchParams.get('price');
        const rawQty = url.searchParams.get('qty');
        const price = Number(rawPrice);
        const qty = Number(rawQty);
        const cents = Math.round(price * 100);
        if (!rawPrice?.trim() || !rawQty?.trim() || !Number.isFinite(price) || price < 0 || !Number.isSafeInteger(qty) || qty < 0 || !Number.isSafeInteger(cents) || !Number.isSafeInteger(cents * qty)) {
          return json(response, 400, { error: 'Use a non-negative price and a non-negative integer qty within supported numeric limits.' });
        }
        return json(response, 200, { price, qty, total: cents * qty / 100 });
      }
      const route = Object.hasOwn(routes, url.pathname) ? routes[url.pathname] : null;
      if (!route) return json(response, 404, { error: 'Not found' });
      const body = await readFile(path.join(publicDirectory, route[0]));
      response.writeHead(200, { 'Content-Type': route[1] });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch (error) {
      console.error(error);
      json(response, 500, { error: 'Internal server error' });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const server = createServer();
  server.on('error', error => { console.error(`Unable to start MediCart: ${error.message}`); process.exitCode = 1; });
  server.listen(port, '0.0.0.0', () => console.log(`MediCart is running at http://localhost:${port}`));
}
