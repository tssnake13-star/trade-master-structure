import { useState } from 'react';
import { DemoOnly } from '@/lib/demoGate';
import Cabinet from '@/components/cabinet2/Cabinet';
import type { Course, Lesson } from '@/pages/SchoolDashboard';
import { useDashboardTexts } from '@/lib/dashboardTexts';
import logo from '@/assets/logo-header.mp4';
import type { JOutcome, JVerdict } from '@/components/cabinet2/journal';

/**
 * /school/cabinet-preview — кабинет v2 на демо-данных (29.10.2026), чтобы видеть разметку без входа в кабинет.
 * Ничего не читает из кабинета ученика и ничего не пишет; данные ниже выдуманы и подписаны на экране.
 * Названия блоков — как в превью прежнего кабинета (SchoolHomePreview, MAIN_TITLES).
 */
const MAIN: Course = { id: 'demo-tm', title: 'TRADE MASTER 5.0', subtitle: 'Основная программа · 8 блоков системы допуска', is_free: false, sort_order: 2 };
const FREE: Course = { id: 'demo-free', title: 'TLT · Допуск к сделке', subtitle: 'Вводная программа · 5 блоков', is_free: true, sort_order: 1 };
const LOCKED: Course = { id: 'demo-lock', title: 'Практикум', subtitle: '60 дней со мной', is_free: false, sort_order: 3 };
const TITLES = ['Архитектура рынка', 'Психология капитала', 'Допуск к сделке', 'Контекст и структура', 'Точки разворота', 'Фильтрация контекста', 'Hunter_Bot, автоматизация входа', 'Risk Sentinel, защита капитала'];
const LESSONS: Lesson[] = [
  ...TITLES.map((title, i) => ({ id: `m${i + 1}`, course_id: MAIN.id, title, description: i === 5 ? 'Как отделить рабочее направление от шума: неделя, дневка и накопление.' : null, sort_order: i + 1 })),
  ...['Что такое допуск', 'Направление недели', 'Подтверждение на дневке', 'Накопление', 'Первый разбор'].map((title, i) => ({ id: `f${i + 1}`, course_id: FREE.id, title, description: null, sort_order: i + 1 })),
];
const DONE = new Set(['m1', 'm2', 'm3', 'm4', 'm5', 'f1', 'f2', 'f3', 'f4', 'f5']);
const day = (d: number, h = 9) => new Date(Date.now() - d * 86400000 + h * 3600e3).toISOString();
const VERDICTS: JVerdict[] = [
  { time: day(0, -2), instrument: 'GBPUSD', side: 'BUY', verdict: 'ДОПУСК', reason: 'Неделя и дневка вверх, накопление у зоны, условие входа выполнено' },
  { time: day(1), instrument: 'USDJPY', side: 'SELL', verdict: 'ОТКАЗ', reason: 'Против направления недели: дневка ещё не подтвердила разворот' },
  { time: day(1, -5), instrument: 'EURUSD', side: 'BUY', verdict: 'ДОПУСК', reason: 'Направление совпало на неделе и дневке' },
  { time: day(2), instrument: 'AUDUSD', side: 'BUY', verdict: 'ОТКАЗ', reason: 'Накопления нет: вход был бы посреди движения' },
  { time: day(3), instrument: 'XAUUSD', side: 'SELL', verdict: 'ОТКАЗ', reason: 'Цель ближе, чем риск: соотношение не проходит' },
  { time: day(4), instrument: 'NZDUSD', side: 'SELL', verdict: 'ОТКАЗ', reason: 'Рынок идёт в разные стороны на неделе и дневке' },
  { time: day(6), instrument: 'CADJPY', side: 'BUY', verdict: 'ОТКАЗ', reason: 'Неделя вверх, дневка вниз: подтверждения нет' },
];
const RES = ['ВОШЁЛ · СТОП', 'ВОШЁЛ · ТЕЙК 9,5 к 1', 'ВОШЁЛ · СТОП', 'ВОШЁЛ · СТОП', 'ВОШЁЛ · БЕЗУБЫТОК', 'ВОШЁЛ · СТОП', 'ВОШЁЛ · ТЕЙК 10,8 к 1', 'ВОШЁЛ · СТОП', 'ВОШЁЛ · СТОП', 'ВОШЁЛ · ТЕЙК 8,4 к 1', 'ВОШЁЛ · СТОП', 'ВОШЁЛ · СТОП'];
const PAIRS = ['EURUSD', 'GBPJPY', 'USDCAD', 'AUDJPY', 'EURGBP', 'NZDUSD', 'USDCHF', 'GBPUSD', 'EURJPY', 'GBPAUD', 'CADJPY', 'USDJPY'];
const OUTCOMES: JOutcome[] = RES.map((result, i) => ({ time: day(80 - i * 7), instrument: PAIRS[i], side: i % 2 ? 'SELL' : 'BUY', result }));

export default function CabinetPreview() {
  return <DemoOnly><CabinetPreviewPage /></DemoOnly>;
}

function CabinetPreviewPage() {
  const { t } = useDashboardTexts();
  const [sel, setSel] = useState<string | null>(null);
  const courses = [FREE, MAIN, LOCKED];
  const has = (c: Course) => c.id !== LOCKED.id;
  const lessonsOf = (id: string) => LESSONS.filter((l) => l.course_id === id);
  const unlockedOf = (c: Course, l: Lesson[]) => (c.id === MAIN.id ? [1, 2, 3, 4, 5, 6] : l.map((_, i) => i + 1));
  const next = LESSONS.find((l) => l.id === 'm6') || null;
  const lives = (() => {
    const out: Date[] = [];
    for (let i = 0; i < 14 && out.length < 3; i++) {
      const d = new Date(Date.now() + i * 86400000), a = new Date(d.getTime() + 5 * 3600e3);
      if (a.getUTCDay() === 1 || a.getUTCDay() === 4) {
        const ev = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate(), 15));
        if (ev.getTime() + 7200e3 > Date.now()) out.push(ev);
      }
    }
    return out;
  })();
  return (
    <>
      <div style={{ position: 'fixed', left: 12, bottom: 12, zIndex: 90, padding: '6px 12px', borderRadius: 999, background: '#CDAA6E', color: '#0A0E18', font: '600 12px Geologica, system-ui' }}>
        Превью кабинета · демо-данные
      </div>
      <Cabinet
        t={t} logo={logo} isAdmin={false} isFreeUser={false} userId={undefined} name="Александр Т." email="" initial="А"
        courses={courses} accessMap={new Map()} hasAccess={has} expiredAccess={new Map()}
        progress={{ [MAIN.id]: { completed: 5, total: 8 }, [FREE.id]: { completed: 5, total: 5 }, [LOCKED.id]: { completed: 0, total: 0 } }}
        lessonsOf={lessonsOf} unlockedOf={unlockedOf} firstIncomplete={() => next} completedIds={DONE}
        mainCourse={MAIN} mainProgress={{ completed: 5, total: 8 }} mainNext={next}
        programEnd={new Date(Date.now() + 48 * 86400000)} daysInSystem={42} upcomingLives={lives}
        recentActivity={['m5', 'm4', 'm3'].map((id, i) => ({ lesson_id: id, completed_at: day(i * 2 + 1), lesson: LESSONS.find((l) => l.id === id) }))}
        eye={{ state: 'open', trial: false, until: null, newCount: 1 }}
        journal={{ verdicts: VERDICTS, outcomes: OUTCOMES, loaded: true }}
        seenMs={new Date(day(1)).getTime()}
        selectedCourse={sel} onSelectCourse={setSel}
        onOpenLesson={() => {}} onOpenTerminal={() => {}} onOpenJournal={() => {}} onProfile={() => {}} onAdmin={() => {}} onSignOut={() => {}}
      />
    </>
  );
}
