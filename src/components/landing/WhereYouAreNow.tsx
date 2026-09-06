import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';

/**
 * «Где вы сейчас» — навигация вместо витрины. Человек узнаёт своё состояние,
 * а не сравнивает четыре тарифа между собой.
 *
 * ⚠️ Цены Trade OS Plus и VIP на лендинге не раскрываются (showPrices=false):
 * там видно только $349 и $499, остальные суммы живут на /access.
 */

const GOLD = 'hsl(var(--accent))';
const MONO: React.CSSProperties = { fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' };

type Row = { state: string; name: string; price?: string; alwaysPrice?: boolean };

const ROWS: Row[] = [
  { state: 'Хочу разобрать систему сам, в своём темпе', name: 'Trade System', price: '$349', alwaysPrice: true },
  { state: 'Систему знаю, а на живом графике применить не выходит', name: 'Практикум', price: '$499', alwaysPrice: true },
  { state: 'Торгую давно и хочу собрать торговлю в систему', name: 'Trade OS Plus', price: '$1599' },
  { state: 'Нужна вся инфраструктура, вместе с инструментами', name: 'VIP', price: '$2990' },
];

export default function WhereYouAreNow({ showPrices }: { showPrices: boolean }) {
  return (
    <div>
      <div className="text-mono" style={{ ...MONO, color: GOLD }}>Где вы сейчас</div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {ROWS.map((r) => (
          <div
            key={r.name}
            className="flex items-start justify-between gap-4 p-4"
            style={{ border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
          >
            <p className="text-sm text-muted-foreground leading-relaxed">{r.state}</p>
            <div className="text-right flex-shrink-0">
              <div className="text-sm text-foreground font-medium whitespace-nowrap">{r.name}</div>
              {(showPrices || r.alwaysPrice) && r.price && (
                <div className="text-mono mt-0.5" style={{ ...MONO, letterSpacing: '0.12em', color: GOLD }}>{r.price}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      <a
        href={TELEGRAM_LINKS.razbor}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClick('where_you_are_verdict')}
        className="mt-3 inline-flex items-start gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowRight size={15} style={{ color: GOLD, marginTop: 3, flexShrink: 0 }} className="group-hover:translate-x-1 transition-transform" />
        <span>
          Не узнали себя? Пришлите одну свою сделку — скажу, какой уровень вам нужен.
          <b className="text-foreground/80"> И скажу, если не нужен никакой.</b>
        </span>
      </a>
    </div>
  );
}
