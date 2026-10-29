import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Демо-страницы кабинета и терминалов (29.10.2026) — на выдуманных данных, для просмотра превью ветки и в разработке.
 * На рабочем сайте их нет: выдуманные решения и итоги в R там читались бы как настоящие. Адрес ведёт на вход в кабинет.
 */
export const isLiveSite = () => typeof window !== 'undefined' && /(^|\.)tradeliketyo\.com$/i.test(window.location.hostname);

export function DemoOnly({ children }: { children: ReactNode }) {
  return isLiveSite() ? <Navigate to="/school" replace /> : <>{children}</>;
}
