// Build-time pre-render: bake the public landing page ("/") into static HTML so
// bots, LLMs and parsers (which don't run JS) receive the full text. Runs after
// the client build (`dist/`) and the SSR build (`dist-ssr/`). The browser hydrates
// this HTML on load (see src/main.tsx), so interactivity is unchanged.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const ssrEntry = path.join(root, 'dist-ssr', 'entry-server.js');

const template = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

if (!template.includes('<!--app-html-->')) {
  console.error('prerender: placeholder <!--app-html--> not found in dist/index.html — skipping');
  process.exit(0);
}

const { render } = await import(pathToFileURL(ssrEntry).href);

// Bare SPA shell (empty #root) for every NON-landing route (cabinet, previews…).
// Vercel serves this for all routes except "/", so those pages boot as a normal
// client SPA — no flash of the landing, no hydration mismatch.
const bareShell = template.replace('<!--app-html-->', '');
fs.writeFileSync(path.join(distDir, 'app.html'), bareShell);
console.log('✓ wrote bare SPA shell → dist/app.html');

// Public routes to pre-render. The cabinet stays client-only (private).
const routes = ['/'];

for (const url of routes) {
  const appHtml = render(url);
  const html = template.replace('<!--app-html-->', appHtml);
  const outPath =
    url === '/'
      ? path.join(distDir, 'index.html')
      : path.join(distDir, url.replace(/^\//, ''), 'index.html');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, html);
  console.log(`✓ pre-rendered ${url} → ${path.relative(root, outPath)} (${appHtml.length} bytes of HTML)`);
}
