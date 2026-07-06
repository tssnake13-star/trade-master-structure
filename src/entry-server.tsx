import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { AppShell } from "./App";
import { AuthProvider } from "@/contexts/AuthContext";
import SiteAssetsApplier from "@/components/SiteAssetsApplier";
import Index from "./pages/Index";

/**
 * Build-time pre-render of the PUBLIC landing page ("/") to static HTML.
 *
 * We render only the landing tree here (not the cabinet pages) so the SSR bundle
 * stays small and free of browser-only module code. The DOM produced matches what
 * the client renders at "/", so the browser hydrates it cleanly (main.tsx).
 */
export function render(url: string): string {
  return renderToString(
    <AppShell>
      <StaticRouter location={url}>
        <SiteAssetsApplier />
        <AuthProvider>
          <Index />
        </AuthProvider>
      </StaticRouter>
    </AppShell>
  );
}
