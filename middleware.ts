import { rewrite, next } from '@vercel/edge';

// Vercel Edge Middleware — runs before the filesystem, so it can intercept "/" and "/access".
// Who gets the pre-rendered HTML (full text of the page):
//   · every known bot / crawler / social scraper / LLM reader (BOT_RE);
//   · every client that is NOT a real browser opening the page — scripts and AI agents
//     with generic user agents (python-requests, curl, node-fetch, Go, axios…), unknown
//     bots, old browsers. Since 04.10.2026 (Сергей: «чтобы любой ИИ смог читать хотя бы
//     текст») this is the default: before, only named bots got the text, and an AI tool
//     fetching the page with a plain HTTP client saw an empty 8 KB shell.
//   · since 05.10.2026 the same for the pricing page /access (Сергей: «опять gpt не может
//     прочитать страницу» — ChatGPT по ссылке на цены видел пустую оболочку).
// Real browsers opening the page get the light client-side shell (index.html).
// A real browser navigation is recognised by Fetch Metadata headers, which every
// modern browser sends and plain HTTP clients don't. Both variants carry the same
// scripts, so a human who lands on a pre-rendered file still gets the full working app.
export const config = {
  matcher: ['/', '/access'],
};

const PRERENDERED: Record<string, string> = {
  '/': '/prerendered.html',
  '/access': '/access-prerendered.html',
};

const BOT_RE =
  /bot|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp|telegram|discord|embedly|slackbot|chatgpt|gptbot|oai-searchbot|claude|anthropic|perplexity|yandex|baidu|ia_archiver|linkedin|pinterest|quora|applebot|duckduck|google-inspectiontool|google-extended|cohere|mistral|meta-externalagent|bytespider|amazonbot|youbot|diffbot|ccbot|ai2bot|timpibot/i;

export default function middleware(request: Request) {
  const target = PRERENDERED[new URL(request.url).pathname];
  if (!target) return next();

  const ua = request.headers.get('user-agent') || '';
  const dest = request.headers.get('sec-fetch-dest');
  const mode = request.headers.get('sec-fetch-mode');
  const browserNavigation = dest === 'document' || mode === 'navigate';

  if (BOT_RE.test(ua) || !browserNavigation) {
    return rewrite(new URL(target, request.url));
  }
  return next();
}
