import type { ComponentType } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import Index from './pages/Index';
import Access from './pages/Access';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

// /privacy и /terms (07.10.2026): документы должны читаться и без скриптов,
// их открывают проверяющие роботы рекламных площадок и ИИ-читатели.
const PAGES: Record<string, ComponentType> = {
  '/access': Access,
  '/privacy': Privacy,
  '/terms': Terms,
};

/**
 * Build-time render of a page to static HTML: the landing ("/") and, since 05.10.2026,
 * the pricing page ("/access"). Used ONLY for the variant served to bots, LLM readers
 * and AI agents (see middleware.ts) — humans in a browser get the light client-side
 * shell (index.html), so there is no hydration and no extra weight. We render just the
 * page tree (no toasters), so the SSR bundle stays small and free of browser-only code.
 *
 * /access — Сергей 05.10.2026: ChatGPT по ссылке на цены видел пустую оболочку
 * («опять gpt не может прочитать страницу»).
 */
export function render(url: string = '/'): string {
  const queryClient = new QueryClient();
  const Page = PAGES[url] ?? Index;
  return renderToString(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StaticRouter location={url}>
          <AuthProvider>
            <Page />
          </AuthProvider>
        </StaticRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
