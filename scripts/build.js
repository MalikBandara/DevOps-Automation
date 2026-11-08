import { cp, mkdir } from 'node:fs/promises';

// A static frontend artifact for the delivery job; the Node app runs from source.
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await cp(new URL('../public/', import.meta.url), new URL('../dist/', import.meta.url), { recursive: true });
console.log('Frontend files copied to dist/. Run npm start for the complete app and API.');
