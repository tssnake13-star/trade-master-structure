// Данные живого графика — ровно то, что нарисовала рисовалка бота (terminal_publish.py,
// _scene_of). Координаты: x — номер свечи, y — цена. Правил здесь нет: только фигуры.

export type Layer = 'acc' | 'cycle' | 'trans' | 'add' | 'swing' | 'rev' | 'zone' | 'price' | 'other';

export interface SLine { k: 'line'; p: [number, number][]; c: string; a: number; w: number; d: number[] | null; z: number; L: Layer }
export interface SMark { k: 'mark'; x: number; y: number; m: 'o' | '^' | 'v' | 'x'; c: string; a: number; e: string; s: number; z: number; L: Layer }
export interface SRect { k: 'rect'; x: number; y: number; w: number; h: number; f: string | null; fa: number; e: string | null; ew: number; z: number; L: Layer }
export interface SPoly { k: 'poly'; p: [number, number][]; f: string; fa: number; z: number; L: Layer }
export type Shape = SLine | SMark | SRect | SPoly;

export interface SLabel { n: number; x: number; y: number; c: string; t: string }
export type SBar = [string, number, number, number, number]; // дата, открытие, максимум, минимум, закрытие

export interface ScenePanel {
  tf: string | null;
  dg: number;
  title: string | null;
  note: string | null;
  foot: string | null;
  xlim: [number, number];
  ylim: [number, number];
  edge: number | null;
  x0: number;
  bars: SBar[];
  head: { t: string; c: string; y: number }[];
  shapes: Shape[];
  labels: SLabel[];
  empty?: boolean;
}

export interface Scene {
  v: number;
  title: string | null;
  texts: { t: string; c: string }[];
  panels: ScenePanel[];
}

// Слои — названия его словами. «other» не выключается: это то, что не удалось отнести.
export const LAYERS: [Layer, string][] = [
  ['acc', 'накопления'],
  ['cycle', 'цикл'],
  ['trans', 'переходы'],
  ['add', 'доп. цикл'],
  ['swing', 'свинги'],
  ['rev', 'реверс'],
  ['zone', 'ложный выход'],
  ['price', 'цена'],
];

export function layersOf(scene: Scene | null): Set<Layer> {
  const s = new Set<Layer>();
  scene?.panels.forEach((p) => p.shapes.forEach((sh) => s.add(sh.L)));
  return s;
}

/** Круглые деления шкалы: 1, 2, 5 × 10^k — чтобы цена читалась без запинки. */
export function niceTicks(lo: number, hi: number, n = 6): number[] {
  const span = hi - lo;
  if (!(span > 0)) return [lo];
  const raw = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => span / s <= n) || 10 * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

export function fmtDay(iso: string, tf: string | null) {
  const [y, m, d] = iso.split('-');
  return tf === 'W1' ? `${d}.${m}.${y.slice(2)}` : `${d}.${m}`;
}
