import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from './server.js';

test('Node server serves the storefront, assets and product catalog', async t => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const home = await fetch(base);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /MediCart \| Everyday care, made simple/);
  for (const [route, type] of [['/app.js', 'text/javascript'], ['/style.css', 'text/css']]) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200);
    assert.ok(response.headers.get('content-type').startsWith(type));
  }
  const catalog = await fetch(`${base}/api/products`);
  assert.equal(catalog.status, 200);
  const products = await catalog.json();
  assert.equal(products.length, 6);
  assert.equal(new Set(products.map(product => product.id)).size, products.length);
  assert.ok(products.every(product => product.price > 0));
  assert.equal((await fetch(`${base}/server.js`)).status, 404);
  assert.equal((await fetch(`${base}/%2e%2e%2fpackage.json`)).status, 404);
});

test('health and total endpoints support the Docker smoke test and reject invalid inputs', async t => {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });
  const total = await fetch(`${base}/total?price=500&qty=2`);
  assert.equal(total.status, 200);
  assert.deepEqual(await total.json(), { price: 500, qty: 2, total: 1000 });
  assert.equal((await (await fetch(`${base}/total?price=0.1&qty=3`)).json()).total, 0.3);
  for (const query of ['', '?price=abc&qty=2', '?price=-1&qty=2', '?price=500&qty=1.5', '?price=500&qty=', '?price=1e308&qty=2']) {
    assert.equal((await fetch(`${base}/total${query}`)).status, 400);
  }
  assert.equal((await fetch(`${base}/health`, { method: 'POST' })).status, 405);
});
