// Build-time pre-render of the landing.
// 1) dist/prerendered.html — the landing rendered to static HTML (full text).
//    index.html (the light client shell for real browsers) is left untouched.
//    Which client gets which file is decided in middleware.ts: real browsers get
//    the shell, everyone else (bots, LLM readers, scripts, AI agents) gets the text.
// 2) dist/llms.txt and dist/llms-full.txt — the same landing as plain Markdown for
//    AI tools (04.10.2026, Сергей: «чтобы любой ИИ смог читать хотя бы текст,
//    желательно визуал тоже»). Generated from the same render, so the text never
//    drifts from the site; images go as a list of absolute URLs with descriptions.
// Runs after the client build and the SSR build.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SITE = 'https://www.tradeliketyo.com';
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

// Страница цен /access — тот же приём (05.10.2026). Она закрыта от поиска: в заголовке
// ответа noindex, в robots.txt Disallow для поисковых роботов; ИИ-помощникам, которые
// открывают ссылку по просьбе человека, она доступна. В <head> — свои title, robots
// и canonical, остальное из того же шаблона.
const accessApp = render('/access');
const accessHtml = template
  .replace('<div id="root"></div>', `<div id="root">${accessApp}</div>`)
  .replace(/<title>[^<]*<\/title>/, '<title>Цены и условия — TRADELIKETYO</title>')
  .replace(/<meta name="robots" content="[^"]*"\s*\/?>/, '<meta name="robots" content="noindex, nofollow" />')
  .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, '<link rel="canonical" href="https://www.tradeliketyo.com/access" />');
fs.writeFileSync(path.join(distDir, 'access-prerendered.html'), accessHtml);
console.log(`✓ pre-rendered /access → dist/access-prerendered.html (${accessApp.length} bytes of content)`);

// ---------- llms.txt / llms-full.txt ----------

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', laquo: '«', raquo: '»', hellip: '…', middot: '·', minus: '−', rarr: '→', larr: '←' };
const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
const absUrl = (u) => (/^https?:\/\//.test(u) ? u : `${SITE}${u.startsWith('/') ? '' : '/'}${u}`);
const meta = (name) => {
  const m = template.match(new RegExp(`<meta[^>]+(?:name|property)="${name}"[^>]+content="([^"]*)"`, 'i'));
  return m ? decode(m[1]) : '';
};

// картинки с подписями — до того, как теги будут вырезаны; первой — превью страницы
const images = [];
const seen = new Set();
const ogImage = meta('og:image');
if (ogImage) {
  images.push({ url: absUrl(ogImage), alt: `Превью страницы. ${meta('og:image:alt')}`.trim() });
  seen.add(ogImage);
}
for (const m of appHtml.matchAll(/<img\b[^>]*>/gi)) {
  const src = m[0].match(/\ssrc="([^"]+)"/i)?.[1];
  const alt = decode(m[0].match(/\salt="([^"]*)"/i)?.[1] || '').trim();
  if (!src || seen.has(src)) continue;
  seen.add(src);
  images.push({ url: absUrl(src), alt });
}

// внешние ссылки страницы (бот, канал) — чтобы ИИ знал, куда ведут кнопки.
// tradeliketyo.com/site и подобные — короткие адреса, которые ведут в Telegram-бота,
// их оставляем; пропускаем только саму главную.
const links = [];
const seenLinks = new Set();
for (const m of appHtml.matchAll(/<a\b[^>]*href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)) {
  const href = decode(m[1]);
  if (seenLinks.has(href) || /tradeliketyo\.com\/?(#.*)?$/.test(href)) continue;
  seenLinks.add(href);
  const label = decode(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
  links.push({ href, label });
}

// Вырезать то, что в тексте только мешает: меню (<nav>), дубли, скрытые от экранных
// читалок (aria-hidden — например, вторая копия бегущей строки), декоративный HUD.
// Разметка React SSR корректная, поэтому хватает стека тегов без внешнего парсера.
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const skipEl = (tag, attrs) => tag === 'nav' || /aria-hidden="true"/.test(attrs) || /class="[^"]*\bv3h-hud\b/.test(attrs);
function stripElements(src) {
  let out = '';
  const stack = [];
  let skipAt = -1; // глубина стека, на которой начался вырезаемый элемент
  const re = /<(\/?)([a-zA-Z][\w-]*)\b([^>]*?)(\/?)>|[^<]+|</g;
  for (const m of src.matchAll(re)) {
    const [tok, closing, rawTag, attrs = '', selfClose] = m;
    if (!rawTag) { if (skipAt < 0) out += tok; continue; }
    const tag = rawTag.toLowerCase();
    if (closing) {
      const idx = stack.lastIndexOf(tag);
      if (idx >= 0) stack.length = idx;
      if (skipAt >= 0 && stack.length < skipAt) { skipAt = -1; continue; }
      if (skipAt < 0) out += tok;
      continue;
    }
    const isVoid = VOID.has(tag) || selfClose === '/';
    if (skipAt < 0 && skipEl(tag, attrs)) {
      if (!isVoid) { stack.push(tag); skipAt = stack.length; }
      continue;
    }
    if (!isVoid) stack.push(tag);
    if (skipAt < 0) out += tok;
  }
  return out;
}

let md = stripElements(appHtml.replace(/<!--[\s\S]*?-->/g, ''))
  .replace(/<(script|style|svg|noscript)\b[\s\S]*?<\/\1>/gi, ' ')
  .replace(/<img\b[^>]*>/gi, ' ')
  .replace(/<h1\b[^>]*>/gi, '\n\n# ')
  .replace(/<h2\b[^>]*>/gi, '\n\n## ')
  .replace(/<h3\b[^>]*>/gi, '\n\n### ')
  .replace(/<\/h[1-3]>/gi, '\n\n')
  .replace(/<li\b[^>]*>/gi, '\n- ')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(p|div|section|ul|ol|li|header|footer|article|blockquote|tr|table|summary|details)>/gi, '\n')
  .replace(/<[^>]+>/g, ' ');
// Чистка текста: пробелы перед знаками препинания (остаются от разбивки на <span>),
// бегущая строка инструментов — одной строкой, повторы длинных строк — убрать
// (часть блоков свёрстана дважды: отдельно для телефона и для компьютера).
const seenLines = new Set();
md = decode(md)
  .split('\n')
  .map((l) => l.replace(/[ \t ]+/g, ' ').trim().replace(/ +([,.;:!?»)])/g, '$1').replace(/([«(]) +/g, '$1'))
  .reduce((acc, l) => {
    const prev = acc[acc.length - 1];
    if (prev !== undefined && / ·$/.test(prev) && / ·$/.test(l)) acc[acc.length - 1] = `${prev} ${l}`;
    else acc.push(l);
    return acc;
  }, [])
  .filter((l) => {
    if (l.length <= 25) return true;
    if (seenLines.has(l)) return false;
    seenLines.add(l);
    return true;
  })
  .filter((l, i, arr) => l !== '' || (arr[i - 1] ?? '') !== '')
  .join('\n')
  .replace(/ ·$/gm, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const title = (template.match(/<title>([^<]*)<\/title>/i)?.[1] || 'TRADELIKETYO').trim();
const description = meta('description');
const updated = new Date().toISOString().slice(0, 10);

const imagesMd = images.map((i) => `- ${i.url}${i.alt ? ` — ${i.alt}` : ''}`).join('\n');
const linksMd = [
  `- Сайт: ${SITE}/`,
  ...links.map((l) => `- ${l.label || 'Ссылка'}: ${l.href}`),
].join('\n');

const header = `# ${decode(title)}

> ${description}

Текстовая версия главной страницы ${SITE}/ для ИИ-ассистентов и поисковых систем.
Собирается автоматически из той же страницы, что видят посетители. Обновлено: ${updated}.
Результаты торговли на странице — из личного журнала сделок автора; прошлый результат
не гарантирует будущий, это не инвестиционная рекомендация.

## Ссылки

${linksMd}
`;

fs.writeFileSync(
  path.join(distDir, 'llms.txt'),
  `${header}
## Полный текст

- Полный текст главной страницы в Markdown: ${SITE}/llms-full.txt
- Изображения страницы (фото автора, скрины сделок) с описаниями перечислены в конце полного текста.
`,
);

fs.writeFileSync(
  path.join(distDir, 'llms-full.txt'),
  `${header}
## Текст страницы

${md}

## Изображения на странице

${imagesMd}
`,
);

console.log(`✓ llms.txt, llms-full.txt → dist (${md.length} символов текста, ${images.length} изображений, ${links.length} внешних ссылок)`);
