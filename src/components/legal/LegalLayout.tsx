import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import '@/styles/v3-skin.css';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackPageview } from '@/lib/analytics';

/**
 * Документы школы: политика конфиденциальности (/privacy) и пользовательское
 * соглашение (/terms). Появились 07.10.2026: форма регистрации ссылалась на них,
 * а самих страниц не было. Оператор данных и исполнитель — Сергей Тё как частное
 * лицо, связь через Telegram (решение Сергея 07.10.2026: «на частное лицо пока что,
 * контакт укажи в Телеграм»). Когда появится ИП, поменять OPERATOR_LINE здесь,
 * вступление в Terms.tsx («мной, Сергеем Тё») и дату редакции.
 *
 * ⚠️ Условия возврата в /terms переписаны из оффера (раздел 6). Меняется оффер —
 * меняется и соглашение, иначе на сайте живут два разных правила.
 */

export const LEGAL_EDITION = '7 октября 2026 года';
export const OPERATOR = 'Сергей Тё';
export const OPERATOR_LINE = `${OPERATOR}, частное лицо, Республика Казахстан`;

const BODY = 'hsl(var(--foreground) / 0.8)';
const MONO = "'Space Mono', ui-monospace, monospace";

export function TgContact() {
  return (
    <a
      href={TELEGRAM_LINKS.dm}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:text-foreground transition-colors"
    >
      @tradeliketyo
    </a>
  );
}

export function DocLink({ to, children }: { to: '/privacy' | '/terms'; children: ReactNode }) {
  return (
    <Link to={to} className="underline underline-offset-2 hover:text-foreground transition-colors">
      {children}
    </Link>
  );
}

export function LegalSection({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="mt-10 md:mt-12">
      <h2 className="text-foreground" style={{ fontSize: 'clamp(24px, 3vw, 32px)', lineHeight: 1.15 }}>
        <span style={{ color: 'hsl(var(--accent))' }}>{n}.</span> {title}
      </h2>
      <div className="mt-4 space-y-3 text-[15px] md:text-base leading-relaxed" style={{ color: BODY }}>
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 pl-5 list-disc marker:text-[hsl(var(--accent))]">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function LegalLayout({
  path,
  title,
  heading,
  intro,
  children,
}: {
  path: '/privacy' | '/terms';
  title: string;
  heading: ReactNode;
  intro: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => { trackPageview(path); }, [path]);
  useEffect(() => {
    const prev = document.title;
    document.title = `${title} — TRADELIKETYO`;
    return () => { document.title = prev; };
  }, [title]);

  const footLink = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' as const };

  return (
    <div
      className="landing-skin v3-skin min-h-screen relative"
      style={{ background: 'var(--v3-bg, hsl(var(--background)))', color: 'hsl(var(--foreground))' }}
    >
      <main className="relative">
        <article className="container-landing pt-14 md:pt-24 pb-16 md:pb-24">
          <div style={{ maxWidth: '68ch' }}>
            <Link
              to="/"
              className="inline-block mb-8 hover:text-foreground transition-colors"
              style={{ ...footLink, color: 'hsl(var(--muted-foreground))' }}
            >
              ← TRADELIKETYO
            </Link>
            <span className="section-label block" style={{ color: 'hsl(var(--accent))' }}>
              Документы · редакция от {LEGAL_EDITION}
            </span>
            {/* размер подобран под самое длинное слово «конфиденциальности»: на 320–414px и в колонке
                68ch оно встаёт в строку целиком, а не рвётся посередине */}
            <h1 className="text-foreground" style={{ fontSize: 'clamp(26px, 8vw, 54px)', lineHeight: 1.04 }}>
              {heading}
            </h1>
            <div className="mt-6 space-y-3 text-base md:text-lg leading-relaxed" style={{ color: BODY }}>
              {intro}
            </div>
            {children}
          </div>
        </article>

        <footer className="relative border-t py-8" style={{ borderColor: 'hsl(var(--rule-soft))' }}>
          <div className="container-landing flex flex-col md:flex-row items-center justify-between gap-4 text-center">
            <span style={{ ...footLink, color: 'hsl(var(--muted-foreground) / 0.6)' }}>TRADELIKETYO · 2026</span>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2" style={{ ...footLink, color: 'hsl(var(--muted-foreground) / 0.8)' }}>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Политика конфиденциальности</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Пользовательское соглашение</Link>
              <a href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                Написать Сергею
              </a>
            </nav>
          </div>
        </footer>
      </main>
    </div>
  );
}
