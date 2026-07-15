import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/contexts/AuthContext';
import Index from './pages/Index';

/**
 * Build-time render of the PUBLIC landing page ("/") to static HTML.
 * Used ONLY for the bots/crawlers/LLMs variant (dist/prerendered.html) — humans
 * get the light client-side shell (index.html), so there is no hydration and no
 * extra weight on the browser. We render just the landing tree (no toasters), so
 * the SSR bundle stays small and free of browser-only module code.
 */
export function render(): string {
  const queryClient = new QueryClient();
  return renderToString(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StaticRouter location="/">
          <AuthProvider>
            <Index />
          </AuthProvider>
        </StaticRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
