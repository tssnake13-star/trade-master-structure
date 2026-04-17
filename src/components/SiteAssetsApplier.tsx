import { useEffect } from 'react';
import { useSiteAsset, SITE_ASSET_KEYS } from '@/hooks/useSiteAsset';

/**
 * Applies dynamic site assets that live outside the React tree:
 * - <link rel="icon"> (favicon)
 * - og:image / twitter:image meta tags
 *
 * Falls back to the URLs already declared in index.html when no custom value is set.
 */
const FALLBACK = ''; // empty string -> hook returns existing DOM value via fallback below

const SiteAssetsApplier = () => {
  // Read from settings; if empty, we keep whatever index.html defined originally.
  const favicon = useSiteAsset(SITE_ASSET_KEYS.favicon, FALLBACK);

  useEffect(() => {
    if (!favicon) return;

    // Update favicon link(s)
    const head = document.head;
    const existingIcons = head.querySelectorAll<HTMLLinkElement>("link[rel~='icon']");
    if (existingIcons.length > 0) {
      existingIcons.forEach((l) => {
        l.href = favicon;
      });
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = favicon;
      head.appendChild(link);
    }

    // Update OG / Twitter image (used when shared)
    const setMeta = (selector: string, attr: 'content', value: string) => {
      const el = head.querySelector<HTMLMetaElement>(selector);
      if (el) el.setAttribute(attr, value);
    };
    setMeta("meta[property='og:image']", 'content', favicon);
    setMeta("meta[name='twitter:image']", 'content', favicon);
  }, [favicon]);

  return null;
};

export default SiteAssetsApplier;
