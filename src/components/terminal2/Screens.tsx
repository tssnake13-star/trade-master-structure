import { Lock } from 'lucide-react';
import Boot, { type BootSteps } from '@/components/terminal/Boot';
import Room from '@/components/cabinet2/Room';
import { EYE_PATH } from '@/components/cabinet2/EyeButton';
import { TELEGRAM_LINKS } from '@/lib/constants';
import { ECOSYSTEM } from '@/lib/prices';
import '@/styles/echo-fx.css';
import '@/styles/cabinet-v2.css';
import '@/styles/terminal-v2.css';

/** Глаз системы: тот же, что на кнопке терминала в кабинете (EyeButton) — моргает раз в 7 с, зрачок светится */
export function BrandEye({ size = 30, opening = false }: { size?: number; opening?: boolean }) {
  return (
    <svg
      className={opening ? 'cv2-eye tv2-eye-open' : 'cv2-eye'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={EYE_PATH} />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Запуск терминала (25.10.2026) — тот же экран, в ночной комнате кабинета */
export function BootScreen({ steps }: { steps: BootSteps }) {
  return (
    <div className="cv2 tv2 tv2-boot">
      <Room />
      <Boot steps={steps} />
    </div>
  );
}

/** Нет доступа или срок закончился (07.10.2026: у кого пробный доступ закончился, видят «срок закончился») */
export function NoAccess({ expired, onCabinet, onPrices }: { expired: boolean; onCabinet: () => void; onPrices: () => void }) {
  const first = ECOSYSTEM.find((t) => t.period === 'первый месяц');
  return (
    <div className="cv2 tv2">
      <Room />
      <div className="tv2-center">
        <div className="tv2-panel tv2-noaccess tv2-in">
          <div className="tv2-noaccess-eye">
            <BrandEye size={44} />
          </div>
          <h1>{expired ? 'Срок доступа закончился' : 'Доступ пока не открыт'}</h1>
          <p>
            ECHO-GATE INSIDE открывается подпиской{first ? `, первый месяц стоит ${first.price}` : ''}. Стоимость всех
            сроков подписки есть на главной странице сайта, а подключиться можно, написав Сергею. Если подписка у вас
            есть, а экран пустой, тоже напишите: откроем.
          </p>
          <div className="tv2-noaccess-btns">
            <a className="cv2-btn cv2-btn-brass" href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer">
              Написать Сергею
            </a>
            <button type="button" className="cv2-btn cv2-btn-ghost" onClick={onPrices}>
              Стоимость
            </button>
            <button type="button" className="cv2-btn cv2-btn-ghost" onClick={onCabinet}>
              В кабинет
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Закрытый раздел пробного доступа: что здесь и как открыть */
export function TrialLock({ what }: { what: string }) {
  return (
    <div className="tv2-panel tv2-lock">
      <Lock size={22} />
      <div className="tv2-lock-t">{what} открывается в подписке</div>
      <p>
        В пробном доступе открыты журнал моих решений с задержкой в 3 дня, итоги решений и несколько инструментов
        целиком. {what} показывает, куда смотреть на этой неделе, и работает у подписчиков.
      </p>
      <a className="cv2-btn cv2-btn-brass" href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer">
        Открыть всё: написать Сергею
      </a>
    </div>
  );
}

/** 07.10.2026: плашка пробного доступа — что открыто, что под замком, как открыть всё */
export function TrialBanner({ days, open, locked }: { days: number; open: string[]; locked: { symbol: string }[] }) {
  return (
    <div className="tv2-panel tv2-trial">
      <div className="tv2-trial-row">
        {/* 11.10.2026: в последние 2 дня плашка говорит «осталось» и теплеет, чтобы конец не был сюрпризом */}
        <span className={days <= 2 ? 'tv2-kicker warn' : 'tv2-kicker'}>
          пробный доступ · {days <= 2 ? (days === 1 ? 'остался ' : 'осталось ') : ''}
          {days} {days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}
        </span>
        <span className="tv2-trial-text">
          Открыты журнал моих решений с задержкой в 3 дня, итоги решений{open.length ? ` и ${open.join(', ')} целиком` : ''}. В
          подписке мой вердикт приходит сразу, в терминал и в Telegram, и открываются скринер, ТОП-лист, тренд и остальные
          инструменты.
        </span>
        <a className="cv2-btn cv2-btn-brass" href={TELEGRAM_LINKS.dm} target="_blank" rel="noopener noreferrer">
          Открыть всё
        </a>
      </div>
      {locked.length ? (
        <div className="tv2-trial-locked">
          <Lock size={11} />
          <span>
            под замком {locked.length}: {locked.slice(0, 16).map((c) => c.symbol).join(' · ')}
            {locked.length > 16 ? ` и ещё ${locked.length - 16}` : ''}
          </span>
        </div>
      ) : null}
    </div>
  );
}
