import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * All editable dashboard texts. Keys are stored in `site_settings`
 * with prefix `dashboard_text_`. Admin can edit them in /school/admin → Настройки.
 */
export const DASHBOARD_TEXT_DEFAULTS = {
  // ===== Sidebar =====
  sidebar_brand: 'TRADELIKETYO',
  sidebar_home: 'Главная',
  sidebar_programs_label: 'Программы',
  sidebar_locked: 'Закрыто',
  sidebar_status_intro: 'Вводный доступ',
  sidebar_status_active: 'Активный',
  sidebar_default_name: 'Студент',
  sidebar_signout: 'Выйти',

  // ===== Top header =====
  header_status_intro: 'Вводный доступ',
  header_status_live: 'Live',
  header_status_suffix: 'КАБИНЕТ ТРЕЙДЕРА',
  header_support: 'Поддержка',

  // ===== Footer =====
  footer_copyright: '© TRADELIKETYO · 2026',
  footer_telegram: 'Telegram автора',

  // ===== Selected course view =====
  course_eyebrow: '◆ Программа',
  course_lesson_locked: 'Закрыто',
  course_lesson_repeat: 'Повторить →',
  course_lesson_open: 'Открыть',

  // ===== Paid home — hero =====
  paid_hero_eyebrow: 'С возвращением',
  paid_hero_default_name: 'Трейдер',
  paid_hero_title_template: '{name}, *система* ждёт вас.',
  paid_hero_completed_text: 'Вы прошли 100% основной программы. Приступайте к тренировкам и наработке опыта насмотренности.',

  // ===== Continue card =====
  continue_eyebrow: 'Продолжить · занятие',
  continue_meta_video: '● Видео',
  continue_meta_pdf: '● PDF',
  continue_open: 'Открыть',
  continue_pending_eyebrow: 'Ожидает открытия',
  continue_pending_title: 'Следующее занятие откроет наставник',
  continue_done_eyebrow: 'Программа завершена',
  continue_done_title: 'Все занятия пройдены ✓',

  // ===== KPI cells (paid) =====
  kpi_days_label: 'День в системе',
  kpi_remaining_label: 'Осталось уроков',
  kpi_completed_label: 'Завершено уроков',
  kpi_completed_primary: 'Основные',
  kpi_completed_secondary: 'Дополнительные',
  kpi_countdown_label: 'До завершения обучения',

  // ===== Programs grid =====
  programs_label: 'Программы',
  programs_card_eyebrow: 'Программа',

  // ===== Activity =====
  activity_label: 'Последняя активность',
  activity_empty: 'Пока пусто',

  // ===== Free home =====
  free_hero_title: 'Добро пожаловать в *систему*.',
  free_hero_subtitle_template: 'Вы получили доступ к {total} вводным занятиям TLT. Они показывают, как устроена система. Основная программа TRADE MASTER 4.5 открывается по коду доступа от администратора.',
  free_kpi_intro_label: 'Вводный курс',
  free_kpi_main_label: 'Основная программа',
  free_kpi_main_value_suffix: 'занятий · TM 4.5',
  free_kpi_main_locked: 'Закрыто · нужен код',
  free_intro_eyebrow: 'Доступ открыт · начните здесь',
  free_intro_title: 'Допуск получают *не все*. Начните с первого занятия.',
  free_intro_subtitle: 'Это вводная программа. Она показывает, как устроены правила. Если поймёте — будет основная.',
  free_intro_cta: 'Перейти к занятию 1',
  free_continue_eyebrow: 'Продолжить · занятие',
  free_continue_open: 'Открыть',
  free_done_eyebrow: '◆ Готовы к следующему шагу',
  free_done_title: 'Вы готовы к *основной* программе.',
  free_done_subtitle: 'Свяжитесь с автором — он подскажет как получить доступ.',
  free_done_cta: 'Написать Сергею',
  free_locked_label: 'Программы по допуску',
  free_locked_master: 'Допуск через куратора',
  free_locked_elite: 'По приглашению',
  free_locked_other: 'После TM 4.5',

  // ===== Live streams card =====
  live_label: 'Закрытые прямые эфиры',
  live_unit_d: 'д',
  live_unit_h: 'ч',
  live_unit_m: 'м',
  live_unit_s: 'с',
  live_schedule_label: 'Расписание',
  live_soon_badge: 'Скоро',
  live_footer_text: 'Эфир в группе Telegram / YouTube',

  // ===== Activate code section =====
  code_label: 'Код доступа',
  code_description_full: 'Получили код доступа? Введите его, чтобы открыть основную программу.',
  code_description_compact: 'Получили код? Откройте программу.',
  code_placeholder: 'Введите код',
  code_submit: 'Открыть',
  code_invalid: 'Код недействителен или уже использован',
  code_success: 'Доступ открыт',
  code_error: 'Произошла ошибка',
  code_help_link: 'Нет кода? → Написать Сергею',

  // ===== Loading =====
  loading_label: 'Загрузка',
  locked_program_message: 'Программа закрыта',
} as const;

export type DashboardTextKey = keyof typeof DASHBOARD_TEXT_DEFAULTS;

/**
 * Logical groups for the admin UI. Order is preserved in the editor.
 */
export const DASHBOARD_TEXT_GROUPS: { title: string; keys: DashboardTextKey[] }[] = [
  {
    title: 'Боковое меню',
    keys: [
      'sidebar_brand', 'sidebar_home', 'sidebar_programs_label', 'sidebar_locked',
      'sidebar_status_intro', 'sidebar_status_active', 'sidebar_default_name', 'sidebar_signout',
    ],
  },
  {
    title: 'Верхняя шапка',
    keys: ['header_status_intro', 'header_status_live', 'header_status_suffix', 'header_support'],
  },
  {
    title: 'Подвал',
    keys: ['footer_copyright', 'footer_telegram'],
  },
  {
    title: 'Главная (платный доступ) — Hero',
    keys: [
      'paid_hero_eyebrow', 'paid_hero_default_name',
      'paid_hero_title_template', 'paid_hero_completed_text',
    ],
  },
  {
    title: 'Карточка «Продолжить»',
    keys: [
      'continue_eyebrow', 'continue_meta_video', 'continue_meta_pdf', 'continue_open',
      'continue_pending_eyebrow', 'continue_pending_title',
      'continue_done_eyebrow', 'continue_done_title',
    ],
  },
  {
    title: 'KPI-карточки',
    keys: [
      'kpi_days_label', 'kpi_remaining_label',
      'kpi_completed_label', 'kpi_completed_primary', 'kpi_completed_secondary',
      'kpi_countdown_label',
    ],
  },
  {
    title: 'Сетка программ',
    keys: ['programs_label', 'programs_card_eyebrow'],
  },
  {
    title: 'Последняя активность',
    keys: ['activity_label', 'activity_empty'],
  },
  {
    title: 'Прямые эфиры',
    keys: [
      'live_label', 'live_unit_d', 'live_unit_h', 'live_unit_m', 'live_unit_s',
      'live_schedule_label', 'live_soon_badge', 'live_footer_text',
    ],
  },
  {
    title: 'Активация кода доступа',
    keys: [
      'code_label', 'code_description_full', 'code_description_compact',
      'code_placeholder', 'code_submit',
      'code_invalid', 'code_success', 'code_error', 'code_help_link',
    ],
  },
  {
    title: 'Главная (вводный доступ)',
    keys: [
      'free_hero_title', 'free_hero_subtitle_template',
      'free_kpi_intro_label', 'free_kpi_main_label',
      'free_kpi_main_value_suffix', 'free_kpi_main_locked',
      'free_intro_eyebrow', 'free_intro_title', 'free_intro_subtitle', 'free_intro_cta',
      'free_continue_eyebrow', 'free_continue_open',
      'free_done_eyebrow', 'free_done_title', 'free_done_subtitle', 'free_done_cta',
      'free_locked_label', 'free_locked_master', 'free_locked_elite', 'free_locked_other',
    ],
  },
  {
    title: 'Карточки занятий и состояния',
    keys: [
      'course_eyebrow', 'course_lesson_locked', 'course_lesson_repeat', 'course_lesson_open',
      'loading_label', 'locked_program_message',
    ],
  },
];

const STORAGE_PREFIX = 'dashboard_text_';

// In-memory cache shared across hook instances
let cachedTexts: Record<string, string> | null = null;
const subscribers = new Set<(t: Record<string, string>) => void>();

async function loadAll(): Promise<Record<string, string>> {
  const keys = Object.keys(DASHBOARD_TEXT_DEFAULTS).map(k => STORAGE_PREFIX + k);
  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', keys);
  const map: Record<string, string> = {};
  (data || []).forEach((row: { key: string; value: string }) => {
    const short = row.key.replace(STORAGE_PREFIX, '');
    if (row.value != null && row.value !== '') map[short] = row.value;
  });
  return map;
}

export function notifyDashboardTextsChanged(updated: Record<string, string>) {
  cachedTexts = { ...(cachedTexts || {}), ...updated };
  // Remove empty values so defaults take over
  for (const k of Object.keys(updated)) {
    if (!updated[k]) delete cachedTexts[k];
  }
  subscribers.forEach(fn => fn(cachedTexts!));
}

export function useDashboardTexts() {
  const [overrides, setOverrides] = useState<Record<string, string>>(() => cachedTexts || {});
  const [loaded, setLoaded] = useState(cachedTexts !== null);

  useEffect(() => {
    let mounted = true;
    if (cachedTexts === null) {
      loadAll().then(map => {
        if (!mounted) return;
        cachedTexts = map;
        setOverrides(map);
        setLoaded(true);
        subscribers.forEach(fn => fn(map));
      });
    } else {
      setLoaded(true);
    }
    const fn = (m: Record<string, string>) => setOverrides({ ...m });
    subscribers.add(fn);
    return () => { mounted = false; subscribers.delete(fn); };
  }, []);

  const t = (key: DashboardTextKey, vars?: Record<string, string | number>) => {
    const raw = overrides[key] ?? DASHBOARD_TEXT_DEFAULTS[key];
    if (!vars) return raw;
    return Object.entries(vars).reduce(
      (acc, [k, v]) => acc.split(`{${k}}`).join(String(v)),
      raw,
    );
  };

  return { t, loaded };
}

export const STORAGE_PREFIX_DASHBOARD_TEXT = STORAGE_PREFIX;

export async function loadDashboardTextsForAdmin(): Promise<Record<string, string>> {
  return loadAll();
}