import { ArrowRight } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { trackClick } from '@/lib/analytics';

/**
 * Схема линейки «вход и два пути» (решение Сергея 07.10.2026, ОФФЕР — ЕДИНАЯ
 * ВЕРСИЯ, раздел 2). Вердикт ведёт в два пути: торговать по системе
 * (ECHO-GATE INSIDE) или изучить её (курс, практикум); оба ведут в VIP.
 *
 * ⚠️ На лендинге цены только у курса и практикума (showPrices=false).
 * Цены подписки и VIP живут на /access.
 */

const GOLD = 'hsl(var(--accent))';
const COOL = 'hsl(var(--cool))';
const WIRE = 'hsl(var(--muted-foreground) / 0.28)';
const MONO: React.CSSProperties = { fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' };
const SERIF: React.CSSProperties = { fontFamily: "'Cormorant', serif", fontWeight: 500 };

type Row = { name: string; note: string; price?: string; publicPrice?: boolean };

const PATH_TRADE: Row[] = [
  { name: 'ECHO-GATE INSIDE', note: 'Терминал, мой вердикт и советники' },
  { name: 'От вас 2 действия', note: 'Точка входа и кнопка СТАРТ' },
  { name: 'Подписка', note: '3, 6 или 12 месяцев', price: '$447 · $840 · $1490' },
];

const PATH_LEARN: Row[] = [
  { name: 'Trade System', note: 'Самостоятельно, 365 дней', price: '$349', publicPrice: true },
  { name: 'Практикум', note: 'Вместе со мной, 60 дней', price: '$499', publicPrice: true },
  { name: 'Потом подписка', note: 'Сразу после обучения' },
];

/** вертикальная линия-связка; на телефоне остаётся только она */
const Wire = ({ h = 28 }: { h?: number }) => (
  <div aria-hidden className="mx-auto" style={{ width: 1, height: h, background: WIRE }} />
);

/** развилка: одна линия сверху расходится на две колонки (только от md) */
const Fork = ({ up }: { up?: boolean }) => (
  <div aria-hidden className="hidden md:block relative" style={{ height: 40 }}>
    <div className="absolute" style={{ left: '50%', width: 1, height: 20, background: WIRE, top: up ? 20 : 0 }} />
    <div className="absolute" style={{ left: '25%', right: '25%', height: 1, top: 20, background: WIRE }} />
    <div className="absolute" style={{ left: '25%', width: 1, height: 20, background: WIRE, top: up ? 0 : 20 }} />
    <div className="absolute" style={{ left: '75%', width: 1, height: 20, background: WIRE, top: up ? 0 : 20 }} />
  </div>
);

export default function TwoPathsScheme({
  showPrices,
  detailedEntry = false,
  entryClickId = 'scheme_verdict',
}: {
  showPrices: boolean;
  /** на /access вход в схеме заменяет отдельную карточку вердикта: полный текст и три условия */
  detailedEntry?: boolean;
  entryClickId?: string;
}) {
  const rows = (list: Row[]) => (
    <div className="mt-5">
      {list.map((r) => {
        const price = r.price && (showPrices || r.publicPrice) ? r.price : null;
        return (
          <div
            key={r.name}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3"
            style={{ borderTop: '1px solid hsl(var(--rule-soft))' }}
          >
            <div>
              <div className="text-sm text-foreground font-medium">{r.name}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{r.note}</div>
            </div>
            {/* 07.10.2026, его слово: цены мелкие, «покрупнее нельзя?» — тем же шрифтом, что цена VIP;
                на узком экране строка с тремя ценами переносится под название */}
            {price && (
              <div
                className="flex-shrink-0 text-right"
                style={{ ...SERIF, fontSize: 'clamp(22px, 2.4vw, 28px)', lineHeight: 1.1, color: 'hsl(var(--foreground))', whiteSpace: 'nowrap' }}
              >
                {price}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      {/* вход: бесплатный вердикт. Лимит настоящий: 5 разборов в неделю —
          столько Сергей реально успевает. Число не завышаем никогда. */}
      <a
        href={TELEGRAM_LINKS.razbor}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClick(entryClickId)}
        className={`mx-auto flex ${detailedEntry ? 'max-w-2xl items-start' : 'max-w-md items-center'} justify-between gap-4 p-4 md:p-5 group transition-colors`}
        style={{ border: '1px solid hsl(var(--accent) / 0.35)', background: 'hsl(var(--accent) / 0.05)' }}
      >
        <div>
          <div className="text-mono" style={{ ...MONO, color: GOLD }}>Вход · вердикт · бесплатно</div>
          {detailedEntry ? (
            <>
              <div className="mt-2 text-foreground font-medium">Не готовы решать — пришлите одну свою сделку</div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Ту, где вы всё сделали правильно и всё равно получили убыток. Нужен скрин с компьютера,
                где виден вход и стоп, и пара фраз, почему вы вошли. В течение 48 часов отвечу лично
                голосовым: прошла бы эта сделка допуск или нет и на чём именно она сломалась. Случай
                требует объяснений — запишу видеоразбор.
              </p>
              <p className="mt-2 text-sm text-foreground/80">
                Скажу и то, какой путь вам нужен: торговать по системе или изучать её. И скажу, если не нужен никакой.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Разбираю валютные пары, в основном мажорные, золото и металлы, нефть, биткоин и эфир. Другую крипту не смотрю.
                Скрины с телефона и сделки без описания не разбираю. Беру 5 разборов в неделю.
              </p>
            </>
          ) : (
            <div className="mt-1.5 text-sm text-foreground">Пришлите одну свою сделку: скажу, какой путь ваш</div>
          )}
        </div>
        <ArrowRight className={`w-4 h-4 flex-shrink-0 ${detailedEntry ? 'mt-1' : ''} group-hover:translate-x-1 transition-transform`} style={{ color: GOLD }} />
      </a>

      <div className="md:hidden"><Wire /></div>
      <Fork />

      {/* два пути */}
      <div className="grid gap-3 md:grid-cols-2">
        <div
          className="p-6 md:p-7"
          style={{
            background: 'radial-gradient(120% 80% at 50% 0%, hsl(var(--accent) / 0.08), hsl(var(--card)) 60%)',
            border: '1px solid hsl(var(--accent) / 0.45)',
          }}
        >
          <div className="text-mono" style={{ ...MONO, color: GOLD }}>Путь 01 · главный</div>
          <h3 className="mt-2 text-foreground" style={{ fontSize: 30, lineHeight: 1.05 }}>
            Торговать <em>по системе</em>
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">Не изучая её целиком</p>
          {rows(PATH_TRADE)}
        </div>

        <div className="md:hidden"><Wire h={12} /></div>

        <div className="p-6 md:p-7" style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
          <div className="text-mono" style={{ ...MONO, color: COOL }}>Путь 02</div>
          <h3 className="mt-2 text-foreground" style={{ fontSize: 30, lineHeight: 1.05 }}>
            Изучить <em>систему</em>
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">Самому или вместе со мной</p>
          {rows(PATH_LEARN)}
        </div>
      </div>

      {/* оба пути ведут в VIP: из подписки по мосту, из обучения с зачётом */}
      <div className="md:hidden"><Wire /></div>
      <div className="hidden md:block relative">
        <Fork up />
        <span className="absolute text-mono" style={{ ...MONO, letterSpacing: '0.14em', color: 'hsl(var(--muted-foreground) / 0.7)', top: 2, left: 'calc(25% + 10px)' }}>
          мост
        </span>
        <span className="absolute text-mono" style={{ ...MONO, letterSpacing: '0.14em', color: 'hsl(var(--muted-foreground) / 0.7)', top: 2, right: 'calc(25% + 10px)' }}>
          зачёт
        </span>
      </div>

      <div
        className="mx-auto max-w-md p-5 md:p-6 text-center"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--accent) / 0.3)' }}
      >
        <div className="text-mono" style={{ ...MONO, color: GOLD }}>Всё сразу</div>
        <h3 className="mt-2 text-foreground" style={{ fontSize: 30, lineHeight: 1.05 }}>VIP</h3>
        <p className="mt-1.5 text-sm text-muted-foreground">Пять этапов обучения, терминал на год и инструменты навсегда</p>
        {showPrices && (
          <div className="mt-3" style={{ ...SERIF, fontSize: 30, lineHeight: 1, color: 'hsl(var(--foreground))' }}>$2990</div>
        )}
      </div>
    </div>
  );
}
