import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { TELEGRAM_LINKS } from '@/lib/constants';

/**
 * Два баннера в кабинете. На публичных страницах их нет и быть не должно:
 * там сроки и места читаются как приём инфобизнеса. Здесь сидят люди, которые
 * уже зарегистрировались, и вопрос доверия у них закрыт.
 *
 * 1. Ближайший поток практикума — всем, кроме тех, у кого практикум уже куплен.
 * 2. Персональный отсчёт зачёта — только купившим Trade System, 30 дней с покупки.
 *
 * ⚠️ Правила, которые нельзя нарушать при доработках:
 *   дата старта настоящая и одна, после неё баннер гаснет сам;
 *   новый отсчёт запускается ТОЛЬКО руками, когда поток реально стартовал;
 *   число мест не показываем, пока занято меньше порога («свободно 10 из 10»
 *   читается как «не купил никто»);
 *   тридцать дней зачёта не продлеваются: обещали тридцать, значит тридцать.
 */

// 29.10.2026: баннеры живут в кабинете v2 — латунь и шрифты «Ночного кабинета» (было золото #e1a84d, Cormorant, Space Mono, Syne)
const ACCENT = '#CDAA6E';
const DISPLAY = "'Geologica', 'Segoe UI', system-ui, sans-serif";
const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const SANS = "'Geologica', 'Segoe UI', system-ui, sans-serif";

/**
 * Зачёт оплаченного при переходе выше. Те же числа, что на странице цен.
 * ⚠️ Доплата работает ТОЛЬКО наверх: из курса в практикум доплатой перейти
 * нельзя, это отдельная ступень (решение Сергея 06.09.2026). С 07.10.2026
 * доплата ведёт в VIP: Trade OS Plus снят с витрины. $347 + $2640 = $2987.
 */
const UPGRADE_WINDOW_DAYS = 30;
const VIP_TOPUP = '$2640';
const TRADE_SYSTEM_PRICE = '$347';

type Settings = Record<string, string>;

type AccessInfo = { granted_at?: string | null };

function plural(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

/** «5 сентября» — без года, как в живой речи. */
function formatStartDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

/** Разбивка остатка до даты: дни, часы, минуты, секунды. Как у счётчика эфира. */
function splitCountdown(target: Date, now: Date) {
  let diff = Math.max(0, target.getTime() - now.getTime());
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000);  diff -= h * 3600000;
  const m = Math.floor(diff / 60000);    diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  return { d, h, m, s };
}

/** Начало текущего дня — чтобы отсчёт не прыгал внутри суток. */
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const card: React.CSSProperties = {
  border: `1px solid ${ACCENT}55`,
  background: 'radial-gradient(120% 120% at 0% 0%, rgba(205,170,110,0.12), rgba(9,15,28,0.56) 60%)',
  backdropFilter: 'blur(18px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
  borderRadius: 16,
  padding: '20px 22px',
};

const label: React.CSSProperties = {
  fontFamily: SANS,
  fontSize: 13,
  fontWeight: 600,
  color: ACCENT,
};

const cta: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  marginTop: 16,
  backgroundColor: ACCENT,
  color: '#0A0E18',
  borderRadius: 999,
  padding: '10px 18px',
  fontFamily: SANS,
  fontSize: 14,
  fontWeight: 600,
};

export default function DashboardBanners({ accessMap }: {
  accessMap: Map<string, AccessInfo>;
}) {
  const [s, setS] = useState<Settings | null>(null);
  const [now, setNow] = useState(() => new Date());

  // секунды идут только ради этого счётчика; интервал чистится при размонтировании
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('key, value')
      .like('key', 'banner_%')
      .then(({ data }) => {
        const map: Settings = {};
        for (const row of (data || []) as { key: string; value: string }[]) map[row.key] = row.value;
        setS(map);
      });
  }, []);

  if (!s) return null;

  const num = (key: string, fallback: number) => {
    const v = parseInt(s[key] ?? '', 10);
    return Number.isFinite(v) ? v : fallback;
  };
  const on = (key: string) => s[key] === '1';

  // ---------- Баннер 1: ближайший поток ----------
  const streamDate = (s.banner_stream_date || '').trim();
  const start = streamDate ? new Date(`${streamDate}T00:00:00`) : null;
  const startValid = start && !Number.isNaN(start.getTime());
  // после старта баннер гаснет сам и не возвращается, пока в настройках
  // не появится дата следующего потока
  // до старта показываем дату и счётчик; когда дата наступила или прошла —
  // мягкое «скоро», без даты и без счётчика на нулях. Автоматически новая дата
  // НЕ подставляется: следующий поток ставится руками в настройках.
  const beforeStart = startValid && start!.getTime() > now.getTime();

  const hideFor = (s.banner_stream_hide_courses || '')
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);
  const alreadyBought = hideFor.some(id => accessMap.has(id));

  const seats = num('banner_stream_seats', 10);
  const taken = num('banner_stream_taken', 0);
  const threshold = num('banner_stream_threshold', 3);
  const left = Math.max(0, seats - taken);
  // «свободно 10 из 10» работает против нас — остаток показываем только с порога
  const showSeatsLeft = taken >= threshold && left > 0;

  const streamCountdown = beforeStart ? splitCountdown(start!, now) : null;

  const showStream = on('banner_stream_enabled') && !alreadyBought;

  // ---------- Баннер 2: персональный отсчёт зачёта ----------
  const upgradeCourse = (s.banner_upgrade_course_id || '').trim();
  const grantedAt = upgradeCourse ? accessMap.get(upgradeCourse)?.granted_at : null;
  let daysLeft = 0;
  if (grantedAt) {
    const bought = new Date(grantedAt);
    bought.setHours(0, 0, 0, 0);
    const passed = Math.floor((startOfToday().getTime() - bought.getTime()) / 86400000);
    daysLeft = UPGRADE_WINDOW_DAYS - passed;
  }
  const showUpgrade = on('banner_upgrade_enabled') && !!grantedAt && daysLeft > 0;

  if (!showStream && !showUpgrade) return null;

  return (
    <div className="space-y-3 mb-8">
      {showUpgrade && (
        <div style={card}>
          <div style={label}>Зачёт оплаченного</div>
          <h3 className="mt-2.5" style={{ fontFamily: SANS, fontSize: 19, lineHeight: 1.25, color: '#E6ECF5' }}>
            У вас осталось {daysLeft} {plural(daysLeft, 'день', 'дня', 'дней')}, чтобы перейти
            в VIP с доплатой {VIP_TOPUP}
          </h3>
          <p className="mt-2.5" style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: '#C6D0E0', maxWidth: '62ch' }}>
            Оплаченные {TRADE_SYSTEM_PRICE} засчитываются полностью в течение {UPGRADE_WINDOW_DAYS} дней
            после покупки. Дальше VIP будет по полной стоимости.
          </p>
          <p className="mt-1.5" style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: '#C6D0E0', maxWidth: '62ch' }}>
            За год вы проходите все пять этапов подготовки и выходите на реальный рынок. ECHO-GATE INSIDE
            на год входит, а инструменты остаются у вас навсегда.
          </p>
          {daysLeft <= 7 && (
            <p className="mt-2.5" style={{ fontFamily: MONO, fontSize: 12, color: ACCENT }}>
              Это последняя неделя зачёта.
            </p>
          )}
          <a href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer" style={cta} className="transition hover:brightness-110">
            Перейти в VIP
            <ArrowRight size={14} />
          </a>
        </div>
      )}

      {showStream && (
        // на широком экране отсчёт и кнопка справа от текста, а не под ним: плашка во всю ширину кабинета без пустой правой половины
        <div style={card} className="xl:flex xl:items-center xl:justify-between xl:gap-10">
          <div>
          <div style={label}>Набор в практикум</div>
          <h3 className="mt-2.5" style={{ fontFamily: SANS, fontSize: 19, lineHeight: 1.25, color: '#E6ECF5' }}>
            {beforeStart
              ? `Ближайший поток практикума стартует ${formatStartDate(streamDate)}`
              : 'Следующий поток практикума уже скоро'}
          </h3>
          <p className="mt-2.5" style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: '#C6D0E0', maxWidth: '62ch' }}>
            60 дней работы со мной: живое занятие раз в неделю, разбор ваших сделок лично,
            закрытая группа.{' '}
            {beforeStart
              ? (showSeatsLeft ? `Осталось ${left} ${plural(left, 'место', 'места', 'мест')} из ${seats}.` : `Беру ${seats} человек.`)
              : 'Напишите, скажу дату ближайшего набора.'}
          </p>
          </div>
          <div className="xl:shrink-0 xl:flex xl:items-center xl:gap-8">
          {streamCountdown && (
            <div className="flex gap-4 mt-4 xl:mt-0">
              {[
                { v: streamCountdown.d, l: 'дней' },
                { v: streamCountdown.h, l: 'часов' },
                { v: streamCountdown.m, l: 'минут' },
                { v: streamCountdown.s, l: 'секунд' },
              ].map((x, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 36, lineHeight: 1, color: '#E6ECF5', fontVariantNumeric: 'tabular-nums' }}>
                    {String(x.v).padStart(2, '0')}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: '#94A1B8', marginTop: 4 }}>{x.l}</div>
                </div>
              ))}
            </div>
          )}

          <a href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer" style={cta} className="transition hover:brightness-110 xl:!mt-0">
            Узнать про поток
            <ArrowRight size={14} />
          </a>
          </div>
        </div>
      )}
    </div>
  );
}
