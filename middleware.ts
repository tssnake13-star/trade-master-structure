import { rewrite, next } from '@vercel/edge';

// Vercel Edge Middleware — runs before the filesystem, so it can intercept "/".
// Bots / crawlers / social scrapers / LLM readers get the pre-rendered HTML
// (dist/prerendered.html, full text). Real browsers fall through to the light
// client-side shell (index.html) — no extra weight, no hydration on mobile.
export const config = {
  matcher: '/',
};

const BOT_RE =
  /bot|crawl|spider|slurp|facebookexternalhit|facebot|whatsapp|telegram|discord|embedly|slackbot|chatgpt|gptbot|oai-searchbot|claude|anthropic|perplexity|yandex|baidu|ia_archiver|linkedin|pinterest|quora|applebot|duckduck|google-inspectiontool/i;

export default function middleware(request: Request) {
  const ua = request.headers.get('user-agent') || '';
  if (BOT_RE.test(ua)) {
    return rewrite(new URL('/prerendered.html', request.url));
  }
  return next();
}
