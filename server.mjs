import http from 'node:http';
import { mkdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './server/app.js';
import { firebaseVerifier } from './server/auth.js';
import { checkPasswordSettings } from './server/communities.js';
import { createDb } from './server/db.js';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, 'dist');
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.ttf':'font/ttf','.pdf':'application/pdf','.txt':'text/plain; charset=utf-8','.jpg':'image/jpeg','.webp':'image/webp','.webm':'video/webm','.ogv':'video/ogg','.swc':'text/plain; charset=utf-8'};
// Without a Turso URL, local development uses a file database that never leaves this machine.
if (!process.env.TURSO_DATABASE_URL) { mkdirSync(path.join(here, '.data'), { recursive: true }); process.env.TURSO_DATABASE_URL = 'file:.data/valus.db'; }
for (const problem of checkPasswordSettings()) console.warn('Community settings: ' + problem);
const api = createApp({ db: createDb(), verifyToken: firebaseVerifier() });
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return api(req, res);
    const file = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(file);
    res.writeHead(200, {'Content-Type':types[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}).end(data);
  } catch { res.writeHead(404).end('Not found'); }
});
const port = Number(process.env.PORT) || 4173;
server.listen(port, '127.0.0.1', () => console.log(`Valus is ready at http://127.0.0.1:${port}`));
