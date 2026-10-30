import type { ReactNode } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import DropGroup from '@/components/cabinet2/DropGroup';
import type { Verdict } from '@/components/terminal/Feeds';
import { fmtDate } from '@/components/terminal/theme';
import { BrandEye } from './Screens';
import { fmtAst, freshness } from './derive';
import { TRIAL_LOCKED, type Section } from './model';

/**
 * Шапка терминала v2: назад в кабинет, глаз системы ECHO-GATE INSIDE, вкладки разделов «каплей» (DropGroup),
 * справа — живая точка и свежесть данных по Астане, срок подписки или пробного доступа. Вкладки администратора —
 * отдельной строкой под общими (25.09.2026, его слово: «где-нибудь отдельно, не с общими кнопками»).
 */
export default function Header({
  main, admin, section, onSection, trial, trialOpen, until, updatedAt, now, scan, fresh, onFresh, demo, onBack,
}: {
  main: [Section, string][];
  admin: [Section, string][];
  section: Section;
  onSection: (s: Section) => void;
  trial: boolean;
  trialOpen?: boolean;
  until: string | null;
  updatedAt: string | null;
  now: number;
  scan: boolean;
  fresh: Verdict | null;
  onFresh: () => void;
  demo?: boolean;
  onBack: () => void;
}) {
  const fr = freshness(updatedAt, now);
  // 18.10.2026, его слово: в пробном режиме как с курсами — сначала то, что открыто (журнал решений первым),
  // вкладки под замком — в конце и с замком
  const order = trial
    ? [
        ...main.filter(([s]) => s === 'verdicts'),
        ...main.filter(([s]) => s !== 'verdicts' && !TRIAL_LOCKED.includes(s)),
        ...main.filter(([s]) => TRIAL_LOCKED.includes(s)),
      ]
    : main;
  const items = order.map(([s, name]) => ({
    key: s,
    label: (trial && TRIAL_LOCKED.includes(s) ? (
      <span className="tv2-tab-locked">
        <Lock size={11} aria-hidden="true" />
        {name}
      </span>
    ) : (
      name
    )) as ReactNode,
  }));
  const inMain = main.some(([s]) => s === section);
  const inAdmin = admin.some(([s]) => s === section);
  return (
    <header className="cv2-glass tv2-bar">
      <button type="button" className="tv2-back" onClick={onBack} aria-label="Назад в кабинет">
        <ArrowLeft size={15} />
        <span>кабинет</span>
      </button>
      <div className="tv2-brand">
        <BrandEye size={32} opening={scan} />
        <span className="tv2-brand-t">
          <b>ECHO-GATE INSIDE</b>
          <small>глаз системы</small>
        </span>
      </div>
      <div className="tv2-tabs-scroll">
        <DropGroup
          role="tablist"
          label="Разделы терминала"
          value={section}
          onChange={onSection}
          items={items}
          className={inMain ? 'tv2-tabs' : 'tv2-tabs tv2-tabs-off'}
        />
      </div>
      <div className="tv2-status">
        {demo ? <span className="cv2-chip brass tv2-demo-chip">демо-данные</span> : null}
        {fresh ? (
          <button type="button" className="tv2-fresh-chip" onClick={onFresh}>
            <i aria-hidden="true" />
            новое решение · {fresh.instrument} · {fresh.verdict === 'ДОПУСК' ? 'допуск' : 'отказ'}
          </button>
        ) : null}
        <span className="tv2-status-lines">
          <span className={`tv2-tone ${fr.tone}`} title="Данные с сервера бота обновляются сами раз в сутки, в 03:05 по Астане. Скринер и журнал решений — сразу, как Сергей их отправит.">
            <i className={fr.tone === 'ok' ? 'tv2-live' : 'tv2-live warn'} aria-hidden="true" />
            {fr.word}
            <span className="tv2-status-when num">· {fmtAst(updatedAt)} по Астане</span>
          </span>
          {until ? (
            <span className="tv2-status-sub">
              {trial || trialOpen ? `пробный доступ до ${fmtDate(until)}` : `подписка до ${fmtDate(until)}`}
            </span>
          ) : null}
        </span>
      </div>
      {admin.length ? (
        <div className="tv2-admin">
          <span className="tv2-admin-l">
            <Lock size={11} aria-hidden="true" /> администратор
          </span>
          <div className="tv2-tabs-scroll">
            <DropGroup
              role="tablist"
              variant="sm"
              label="Разделы администратора"
              value={section}
              onChange={onSection}
              items={admin.map(([s, name]) => ({ key: s, label: name }))}
              className={inAdmin ? 'tv2-tabs' : 'tv2-tabs tv2-tabs-off'}
            />
          </div>
        </div>
      ) : null}
    </header>
  );
}
