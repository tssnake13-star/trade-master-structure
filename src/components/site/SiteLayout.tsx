import '@/styles/v3-skin.css';
import '@/styles/night-skin.css';
import { useEffect, useLayoutEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import useScrollAnimate from '@/hooks/useScrollAnimate';
import useLandingFx from '@/hooks/useLandingFx';
import { trackPageview, observeSections } from '@/lib/analytics';
import StructureField from '@/components/landing/StructureField';
import StickyHeader from '@/components/landing/StickyHeader';
import ScrollProgress from '@/components/fx/ScrollProgress';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Общая обёртка страниц сайта (28.10.2026, «Ночной кабинет»). Каждая страница монтирует её заново,
 * поэтому хореография разделов (useLandingFx) запускается на каждой странице с начала.
 *
 * `sections` — id блоков, по которым считаем, до чего доскролливают на этой странице.
 */
export default function SiteLayout({
  path,
  title,
  description,
  sections,
  children,
}: {
  path: string;
  title: string;
  description: string;
  sections: string[];
  children: ReactNode;
}) {
  useScrollAnimate();
  useLandingFx();

  const { hash } = useLocation();

  // новая страница открывается сверху: переход по ссылке внизу прежней страницы не должен оставлять там же
  // instant: у html стоит плавная прокрутка, и без него страница при переходе ехала бы вверх через весь текст
  useIsoLayoutEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  // переход по якорю (/binocular#prices, со старых ссылок бота и кабинета): блок может отрисоваться не сразу
  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    let tries = 0;
    const timer = window.setInterval(() => {
      const el = document.getElementById(id);
      // отступ под закреплённую шапку
      if (el) { window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'instant' as ScrollBehavior }); window.clearInterval(timer); }
      else if (++tries > 20) window.clearInterval(timer);
    }, 100);
    return () => window.clearInterval(timer);
  }, [hash]);

  useEffect(() => {
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    trackPageview(path);
    let disconnect: (() => void) | null = null;
    const timer = window.setTimeout(() => { disconnect = observeSections(sections); }, 400);
    return () => {
      window.clearTimeout(timer);
      disconnect?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background landing-skin v3-skin night-skin relative isolate">
      {/* поле структуры рынка за всей страницей (у первого экрана своё) */}
      <StructureField position="fixed" zIndex={-1} opacity={0.5} rgb="205,170,110" mask="radial-gradient(130% 110% at 50% 42%, #000 38%, transparent 90%)" />
      <ScrollProgress />
      <SiteHeader />
      <StickyHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
