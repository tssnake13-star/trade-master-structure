import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Simple in-memory cache so multiple components don't refetch the same key
const cache = new Map<string, string | null>();
const listeners = new Map<string, Set<(v: string | null) => void>>();

export const SITE_ASSET_KEYS = {
  headerLogo: 'asset_header_logo_url',
  promoVideo: 'asset_promo_video_url',
  heroAuthor: 'asset_hero_author_url',
  favicon: 'asset_favicon_url',
  schoolAuthLogo: 'asset_school_auth_logo_url',
  schoolDashboardLogo: 'asset_school_dashboard_logo_url',
} as const;

export type SiteAssetKey = (typeof SITE_ASSET_KEYS)[keyof typeof SITE_ASSET_KEYS];

async function fetchAsset(key: string): Promise<string | null> {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  return data?.value || null;
}

export function notifySiteAssetChange(key: string, value: string | null) {
  cache.set(key, value);
  listeners.get(key)?.forEach((l) => l(value));
}

/**
 * Returns custom asset URL stored in site_settings, or `fallback` if none is set.
 */
export function useSiteAsset(key: SiteAssetKey, fallback: string): string {
  const [value, setValue] = useState<string | null>(() =>
    cache.has(key) ? (cache.get(key) ?? null) : null,
  );

  useEffect(() => {
    let mounted = true;

    if (!cache.has(key)) {
      fetchAsset(key).then((v) => {
        if (!mounted) return;
        cache.set(key, v);
        setValue(v);
      });
    }

    if (!listeners.has(key)) listeners.set(key, new Set());
    const set = listeners.get(key)!;
    const listener = (v: string | null) => setValue(v);
    set.add(listener);

    return () => {
      mounted = false;
      set.delete(listener);
    };
  }, [key]);

  return value || fallback;
}
