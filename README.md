# MediCart — Node.js application

A simple pharmacy shopping demo using plain JavaScript, CSS, and Node's built-in HTTP server. No framework, external dependencies, database, or build step is required to run it.

## Run locally

Install Node.js 20 or newer, then run:

```sh
npm install
npm start
```

Open **http://localhost:3000**. Stop with Ctrl+C. For server auto-reload, use `npm run dev`.

Features: six sample products, search, category filters, cart quantities/removal, browser cart persistence, and a demo checkout. Checkout does not create real orders or accept payments. Products and prices are fictional; this app does not provide medical advice.

## API

- `GET /api/products` — product catalog used by the frontend.
- `GET /health` — `{"status":"ok"}`.
- `GET /total?price=500&qty=2` — `{"price":500,"qty":2,"total":1000}`.

Invalid or missing price/quantity parameters return HTTP 400. Price must be non-negative and quantity must be a non-negative integer.

## Checks and delivery

```sh
npm test
npm run build
```

The build command copies the frontend to `dist/` for artifact delivery. Run the complete app with `npm start`; the frontend requires the Node API, so `dist/` alone is not a standalone deployment.
