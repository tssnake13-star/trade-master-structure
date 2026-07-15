// Build-time pre-render for BOTS ONLY.
// Renders the landing to static HTML and writes it to dist/prerendered.html.
// index.html (the light client shell served to humans) is left untouched.
// Vercel serves prerendered.html only when the User-Agent is a bot/crawler/LLM
// (see the has-header rewrite in vercel.json), so humans keep the fast SPA and
// bots get the full text. Runs after the client build and the SSR build.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js');

const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

if (!template.includes('<div id="root"></div>')) {
  console.error('prerender: <div id="root"></div> not found in dist/index.html — skipping');
  process.exit(0);
}

const { render } = await import(pathToFileURL(ssrEntry).href);
const appHtml = render();

const html = template.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
fs.writeFileSync(path.join(distDir, 'prerendered.html'), html);

console.log(`✓ pre-rendered bots variant → dist/prerendered.html (${appHtml.length} bytes of content)`);
