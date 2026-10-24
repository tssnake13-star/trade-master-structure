import { CYCLE, N, SIGNAL, ENTRY, VB, SCEN, makeSeries, terminalGeo, seg, ease } from './TerminalDemo';

/**
 * Окно терминала «Недели по системе», нарисованное на холсте, — экран изогнутого монитора (CurvedMonitor,
 * 23.10.2026, Сергей: «Ставь кольцо и монитор, монитор сделай изогнутым»). Изогнуть можно только картинку,
 * поэтому окно TerminalDemo повторено здесь один в один: те же данные (makeSeries, terminalGeo), та же
 * раскладка и тот же ход времени (render в TerminalDemo), шрифты и цвета — из стилей .td-* в v3-skin.css.
 * Возвращает фазу недели для карточек под окном.
 */

export type Palette = { border: string; card: string; accent: string; muted: string; fg: string };

const MONO = '"Martian Mono", ui-monospace, monospace';
const SERIF = 'Literata, Georgia, serif';
const CHART_BG = '#0a0704'; // oklch(0.13 0.01 70)
const STOP_LINE = '#c46761'; // oklch(0.62 0.12 25)
const STOP_TEXT = '#df7f78'; // oklch(0.7 0.12 25)
const BE_BG = '#191511'; // oklch(0.2 0.01 70)
const PILL_BG = '#100d09'; // oklch(0.16 0.01 70)
const TOAST_BG = '#0e0a07'; // oklch(0.15 0.01 70)
const UP = '#dea85c';
const DOWN = '#6c7078';

type Box = { x: number; y: number; w: number; h: number };

/** цвет CSS-переменной вида «36 66% 75%» в rgba() с прозрачностью */
export function hslVar(v: string, a = 1) {
  const m = v.trim().match(/([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/);
  if (!m) return `rgba(200,200,200,${a})`;
  const h = +m[1] / 360, s = +m[2] / 100, l = +m[3] / 100;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t: number) => {
    t = (t + 1) % 1;
    const c = t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p;
    return Math.round(c * 255);
  };
  return `rgba(${f(h + 1 / 3)},${f(h)},${f(h - 1 / 3)},${a})`;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.arcTo(x + w, y, x + w, y + h, k);
  ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k);
  ctx.arcTo(x, y, x + w, y, k);
  ctx.closePath();
}

// ширина буквы в шрифте: measureText дорогой, а букв в кадре около двухсот
const widths = new Map<string, number>();
const charW = (ctx: CanvasRenderingContext2D, ch: string) => {
  const key = ctx.font + '|' + ch;
  let w = widths.get(key);
  if (w === undefined) { w = ctx.measureText(ch).width; widths.set(key, w); }
  return w;
};

/** строка с разрядкой (letter-spacing): по буквам, как в CSS */
function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, sp: number, align: 'left' | 'right' | 'center' = 'left') {
  const ws = Array.from(text).map((ch) => charW(ctx, ch));
  const total = ws.reduce((a, b) => a + b, 0) + sp * Math.max(0, ws.length - 1);
  let cx = align === 'left' ? x : align === 'right' ? x - total : x - total / 2;
  Array.from(text).forEach((ch, i) => { ctx.fillText(ch, cx, y); cx += ws[i] + sp; });
  return total;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number) {
  const out: string[] = [];
  let line = '';
  for (const w of text.split(' ')) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > width && line) { out.push(line); line = w; } else line = next;
  }
  if (line) out.push(line);
  return out;
}

// стрелка курсора; создаётся при первом кадре — при сборке страницы на сервере Path2D нет
let cursor: Path2D | null = null;
const cursorPath = () => (cursor ??= new Path2D('M4 2l15 9.5-6.6 1.4 3.9 7.3-2.6 1.4-3.9-7.3L4 19z'));

export class TerminalPainter {
  readonly canvas = document.createElement('canvas');
  private ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
  W = 0;
  H = 0;
  private narrow = false;
  private pal: Palette;
  private bar: Box = { x: 0, y: 0, w: 0, h: 0 };
  private chart: Box = { x: 0, y: 0, w: 0, h: 0 };
  private side: Box = { x: 0, y: 0, w: 0, h: 0 };
  private toast: Box = { x: 0, y: 0, w: 0, h: 0 };
  private start: Box = { x: 0, y: 0, w: 0, h: 0 };
  private sentinel: Box = { x: 0, y: 0, w: 0, h: 0 };
  private toastLines: string[] = [];
  private sentinelLines: string[] = [];
  private scen = SCEN.map((s) => ({ ...s, series: makeSeries(s.seed, s.dir), geo: terminalGeo(makeSeries(s.seed, s.dir), s.dir) }));
  private paths: { up: Path2D; down: Path2D; wu: Path2D; wd: Path2D }[] = [];
  // заготовки на раскладку: неподвижная часть окна и свечи — по одной на сценарий
  private still: HTMLCanvasElement[] = [];
  private bars: HTMLCanvasElement[] = [];
  private scale = 1;
  private hitAt = -1;

  constructor(pal: Palette) {
    this.pal = pal;
  }

  /** ширина окна в css-пикселях, узкая раскладка (как .td-body на телефоне), плотность пикселей холста */
  layout(W: number, narrow: boolean, scale: number) {
    const ctx = this.ctx;
    this.W = W;
    this.narrow = narrow;
    this.bar = { x: 1, y: 1, w: W - 2, h: 34 };
    const top = this.bar.y + this.bar.h + 1;
    const sideW = narrow ? W - 2 : 248;
    const chartW = narrow ? W - 2 : W - 2 - sideW - 1;
    const chartH = chartW / (narrow ? 1.45 : 2);
    this.chart = { x: 1, y: top, w: chartW, h: chartH };
    const innerW = sideW - 28;
    ctx.font = `13px ${SERIF}`;
    this.toastLines = wrap(ctx, 'Вердикт: допуск подтверждаю. Точку входа — по уроку.', innerW - 24);
    ctx.font = `12px ${SERIF}`;
    this.sentinelLines = wrap(ctx, 'Risk Sentinel · лимиты риска в норме', innerW - 16);
    const toastH = 2 + 10 + 13.5 + 6 + this.toastLines.length * 18.2 + 10;
    const startH = 2 + 13 + 16.5 + 13;
    const sentH = this.sentinelLines.length * 18;
    const contentH = toastH + 12 + startH + 12 + sentH;
    if (narrow) {
      this.side = { x: 1, y: top + chartH + 1, w: sideW, h: contentH + 28 };
    } else {
      this.side = { x: 1 + chartW + 1, y: top, w: sideW, h: Math.max(chartH, contentH + 28) };
      if (this.side.h > chartH) this.chart.h = this.side.h; // не бывает при ширине окна сайта, но на всякий случай
    }
    const cy0 = this.side.y + (narrow ? 14 : (this.side.h - contentH) / 2);
    const cx0 = this.side.x + 14;
    this.toast = { x: cx0, y: cy0, w: innerW, h: toastH };
    this.start = { x: cx0, y: cy0 + toastH + 12, w: innerW, h: startH };
    this.sentinel = { x: cx0, y: this.start.y + startH + 12, w: innerW, h: sentH };
    this.H = Math.ceil((narrow ? this.side.y + this.side.h : top + this.chart.h) + 1);
    this.scale = scale;
    this.canvas.width = Math.round(W * scale);
    this.canvas.height = Math.round(this.H * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    // свечи — в пикселях окна, один раз на раскладку
    const c = this.chart;
    const px = (vx: number) => c.x + (vx / VB.w) * c.w, py = (vy: number) => c.y + (vy / VB.h) * c.h;
    this.paths = this.scen.map(({ series, geo }) => {
      const up = new Path2D(), down = new Path2D(), wu = new Path2D(), wd = new Path2D();
      series.forEach((k, i) => {
        const cx = geo.x(i), bw = geo.slot * 0.32;
        const t = geo.y(Math.max(k.o, k.c)), b = Math.max(geo.y(Math.min(k.o, k.c)), t + 1);
        const body = k.c >= k.o ? up : down;
        body.rect(px(cx - bw), py(t), px(cx + bw) - px(cx - bw), py(b) - py(t));
        const wick = k.c >= k.o ? wu : wd;
        wick.moveTo(Math.round(px(cx)) + 0.5, py(geo.y(k.h)));
        wick.lineTo(Math.round(px(cx)) + 0.5, py(geo.y(k.l)));
      });
      return { up, down, wu, wd };
    });
    this.still = this.scen.map((_, si) => this.prerender((cx) => this.drawStill(cx, si)));
    this.bars = this.scen.map((_, si) => this.prerender((cx) => this.drawCandles(cx, si)));
  }

  private prerender(fn: (c: CanvasRenderingContext2D) => void) {
    const cv = document.createElement('canvas');
    cv.width = this.canvas.width;
    cv.height = this.canvas.height;
    const c = cv.getContext('2d') as CanvasRenderingContext2D;
    c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    fn(c);
    return cv;
  }

  /** окно, полоса заголовка, поле графика с сеткой, граница боковой панели */
  private drawStill(ctx: CanvasRenderingContext2D, si: number) {
    const P = this.pal, c = this.chart;
    rr(ctx, 0.5, 0.5, this.W - 1, this.H - 1, 14);
    ctx.fillStyle = P.card;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = P.border;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, this.bar.y + this.bar.h + 0.5); ctx.lineTo(this.W, this.bar.y + this.bar.h + 0.5); ctx.stroke();
    const by = this.bar.y + this.bar.h / 2;
    ctx.fillStyle = P.border;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(this.bar.x + 14 + 3.5 + i * 12, by, 3.5, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = `10px ${MONO}`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = P.muted;
    spaced(ctx, `ECHO-GATE INSIDE · ${this.scen[si].sym} · D1`.toUpperCase(), this.bar.x + 14 + 31 + 12, by, 1.6);
    ctx.fillStyle = P.accent;
    spaced(ctx, 'LIVE', this.W - 15, by, 1.6, 'right');
    ctx.fillStyle = CHART_BG;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = P.border;
    for (const g of [0.25, 0.5, 0.75]) { ctx.beginPath(); ctx.moveTo(c.x, Math.round(c.y + c.h * g) + 0.5); ctx.lineTo(c.x + c.w, Math.round(c.y + c.h * g) + 0.5); ctx.stroke(); }
    ctx.globalAlpha = 1;
    const s = this.side;
    ctx.beginPath();
    if (this.narrow) { ctx.moveTo(0, s.y - 0.5); ctx.lineTo(this.W, s.y - 0.5); } else { ctx.moveTo(s.x - 0.5, s.y); ctx.lineTo(s.x - 0.5, s.y + s.h); }
    ctx.stroke();
    ctx.restore();
  }

  private drawCandles(ctx: CanvasRenderingContext2D, si: number) {
    const paths = this.paths[si];
    ctx.lineWidth = 1;
    ctx.strokeStyle = UP; ctx.stroke(paths.wu);
    ctx.strokeStyle = DOWN; ctx.stroke(paths.wd);
    ctx.fillStyle = UP; ctx.fill(paths.up);
    ctx.fillStyle = DOWN; ctx.fill(paths.down);
  }

  /** заготовку размером с холст — в пиксели холста один к одному */
  private blit(src: HTMLCanvasElement, alpha = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = alpha;
    ctx.drawImage(src, 0, 0);
    ctx.restore();
  }

  /** кадр в момент ms круга (0…CYCLE) сценария si; time — секунды для пульса «live» */
  draw(ms: number, si: number, time: number) {
    const ctx = this.ctx, P = this.pal;
    const { series, geo, side: sideName, dir } = this.scen[si];
    const c = this.chart;
    const px = (vx: number) => c.x + (vx / VB.w) * c.w, py = (vy: number) => c.y + (vy / VB.h) * c.h;
    const t = ms / 1000;
    const fade = 1 - seg(t, 16.2, 16.9);

    // окно и поле графика — из заготовки, точка «live» пульсирует поверх
    ctx.clearRect(0, 0, this.W, this.H);
    this.blit(this.still[si]);
    ctx.save();
    rr(ctx, 0.5, 0.5, this.W - 1, this.H - 1, 14);
    ctx.clip();
    const by = this.bar.y + this.bar.h / 2;
    ctx.font = `10px ${MONO}`;
    const liveW = Array.from('LIVE').reduce((sum, ch) => sum + charW(ctx, ch), 0) + 1.6 * 3;
    const dx = this.W - 15 - liveW - 9;
    const pulse = (time % 1.8) / 1.8;
    ctx.fillStyle = P.accent;
    ctx.globalAlpha = 0.5 * (1 - pulse);
    ctx.beginPath(); ctx.arc(dx, by, 3 + pulse * 6, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(dx, by, 3, 0, Math.PI * 2); ctx.fill();

    // график: свечи из заготовки с прозрачностью круга
    ctx.save();
    ctx.beginPath(); ctx.rect(c.x, c.y, c.w, c.h); ctx.clip();
    this.blit(this.bars[si], fade * ease(seg(t, 0, 0.6)));
    // шторка будущего
    const live = t < 9.5 ? SIGNAL + 2.6 + seg(t, 6, 9) * 0.4 : ENTRY + 1 + ease(seg(t, 9.5, 15)) * (N - ENTRY - 1);
    const cur = px(geo.x(live) - geo.slot * 0.5);
    ctx.fillStyle = CHART_BG;
    ctx.fillRect(cur, c.y, c.x + c.w - cur, c.h);

    const show = (a: number) => a * fade;
    // 1. зона и допуск
    const za = show(ease(seg(t, 0.6, 1.8)));
    if (za > 0) {
      const zx = px(geo.x(18) - geo.slot / 2), zy = py(geo.y(geo.zoneTop));
      const zw = px(geo.x(SIGNAL)) - px(geo.x(18)), zh = py(geo.y(geo.zoneBot)) - zy;
      ctx.globalAlpha = za;
      ctx.fillStyle = hslVarA(P.accent, 0.16);
      ctx.fillRect(zx, zy, zw, zh);
      ctx.strokeStyle = hslVarA(P.accent, 0.55);
      ctx.strokeRect(zx + 0.5, zy + 0.5, zw - 1, zh - 1);
      ctx.font = `9px ${MONO}`;
      ctx.fillStyle = P.accent;
      ctx.textBaseline = 'alphabetic';
      spaced(ctx, 'НАКОПЛЕНИЕ', zx + 6, zy + zh + 14, 1.26);
      ctx.globalAlpha = 1;
    }

    // линии: тейк от свечи выхода, вход и стоп от свечи входа; подписи над линией
    const lineX0 = (from: number) => px(geo.x(from)), lineX1 = c.x + c.w * 0.98;
    const hitNow = t >= 9.5 && live - 0.5 >= geo.hitIdx;
    if (hitNow && this.hitAt < 0) this.hitAt = t;
    if (t < 9.5) this.hitAt = -1;
    // 24.10.2026, Сергей: «график закрывает слово вход и тейк в конце… особенно на телефоне». Подписи — на тёмной
    // плашке поверх свечей, тейк подписан у левого конца линии (там цена ещё внизу), на телефоне шрифт крупнее
    const fs = this.narrow ? 10.5 : 9;
    const line = (y: number, from: number, color: string, dash: boolean, a: number, label: string, labelColor: string, left: boolean, glow = 0, labelA = 1, below = false) => {
      if (a <= 0) return;
      ctx.globalAlpha = a;
      const yy = Math.round(y) + 0.5;
      if (glow > 0) {
        ctx.save();
        ctx.shadowColor = hslVarA(P.accent, 0.8 * glow);
        ctx.shadowBlur = 14;
      }
      ctx.strokeStyle = color;
      ctx.setLineDash(dash ? [4, 4] : []);
      ctx.beginPath(); ctx.moveTo(lineX0(from), yy); ctx.lineTo(lineX1, yy); ctx.stroke();
      ctx.setLineDash([]);
      if (glow > 0) ctx.restore();
      if (labelA <= 0.01) { ctx.globalAlpha = 1; return; }
      ctx.globalAlpha = a * labelA;
      ctx.font = `${fs}px ${MONO}`;
      const sp = fs * 0.14;
      const tw = Array.from(label).reduce((sum, ch) => sum + charW(ctx, ch), 0) + sp * (label.length - 1);
      const lx = left ? lineX0(from) : lineX1 - tw;
      const top = below ? yy + 4 : yy - 7 - fs - 2;
      rr(ctx, lx - 4, top, tw + 8, fs + 6, 3);
      ctx.fillStyle = 'rgba(10,7,4,0.86)';
      ctx.fill();
      ctx.fillStyle = labelColor;
      ctx.textBaseline = 'alphabetic';
      spaced(ctx, label, lx, top + fs + 3, sp, 'left');
      ctx.globalAlpha = 1;
    };
    const takeA = show(ease(seg(t, 9.1, 9.7)));
    const hit = this.hitAt < 0 ? 0 : ease(seg(t, this.hitAt, this.hitAt + 0.5));
    // на узком экране подписи у тейка и у входа теснятся: подпись тейка уступает место «тейк взят»,
    // подпись стопа гаснет, когда стоп переехал в безубыток, а «безубыток» стоит правее
    line(py(geo.y(geo.take)), SIGNAL, P.accent, !hitNow, takeA, 'ТЕЙК · 9,5R', P.accent, true, hitNow ? 1 : 0, this.narrow ? 1 - hit : 1);
    const be = ease(seg(t, 12, 12.8));
    const stopY = py(geo.y(geo.stop)) + (py(geo.y(geo.entry)) - py(geo.y(geo.stop))) * be;
    line(stopY, ENTRY - 1, STOP_LINE, true, ease(seg(t, 9.1, 9.7)) * fade, 'СТОП · 1R', STOP_TEXT, false, 0, this.narrow ? 1 - be : 1);
    // 24.10.2026, Сергей: «слово „вход“ закрывается графиком, где лонг… надо ниже золотой линии» — подпись
    // входа с пустой стороны: у покупки под линией (цена уходит вверх), у продажи над ней
    line(py(geo.y(geo.entry)), ENTRY - 1, '#ffd38a', false, show(ease(seg(t, 6.3, 6.8))), 'ВХОД', '#ffd38a', true, 0, 1, dir > 0);

    // метки: безубыток и тейк взят — над точкой
    const tag = (x: number, y: number, text: string, a: number, bg: string, fg: string, border?: string, below = false) => {
      if (a <= 0) return;
      ctx.font = `${fs}px ${MONO}`;
      const w = Array.from(text).reduce((s, ch) => s + charW(ctx, ch), 0) + fs * 0.12 * (text.length - 1) + 14;
      const h = fs * 1.5 + 6;
      // метка не выходит за край графика (на узком экране «безубыток» стоит у правого края)
      const x0 = Math.min(Math.max(x - w / 2, c.x + 3), c.x + c.w - w - 3), y0 = below ? y + 7 : y - h * 1.5;
      ctx.globalAlpha = a;
      rr(ctx, x0, y0, w, h, 4);
      ctx.fillStyle = bg; ctx.fill();
      if (border) { ctx.strokeStyle = border; ctx.stroke(); }
      ctx.fillStyle = fg;
      ctx.textBaseline = 'middle';
      spaced(ctx, text, x0 + 7, y0 + h / 2 + 0.5, fs * 0.12);
      ctx.globalAlpha = 1;
    };
    // на узком экране «безубыток» — у правого края и с другой стороны линии, чем подпись «вход»
    tag(px(geo.x(this.narrow ? N - 6 : N - 12)), py(geo.y(geo.entry)), 'БЕЗУБЫТОК', show(ease(seg(t, 12.6, 13.1))), BE_BG, P.fg, P.border, this.narrow && dir < 0);
    tag(px(geo.x(N - 9)), py(geo.y(geo.take)), 'ТЕЙК ВЗЯТ', show(hit), P.accent, '#111');

    // точка цены — на закрытии последней видимой свечи
    const i0 = Math.min(N - 1, Math.floor(live - 0.5)), f = Math.max(0, Math.min(1, live - 0.5 - i0));
    const k = series[i0], kn = series[Math.min(N - 1, i0 + 1)];
    const price = k.c + (kn.c - k.c) * f;
    const dX = px(geo.x(live - 0.5)), dY = py(geo.y(price));
    ctx.globalAlpha = fade;
    ctx.save();
    ctx.shadowColor = hslVarA(P.accent, 0.9);
    ctx.shadowBlur = 14;
    ctx.fillStyle = hslVarA(P.accent, 0.25);
    ctx.beginPath(); ctx.arc(dX, dY, 8.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#ffe2a8';
    ctx.beginPath(); ctx.arc(dX, dY, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // плашка «Допуск · покупка» слева от свечи выхода, у покупки над зоной, у продажи под ней
    const pa = show(ease(seg(t, 1.6, 2.2)));
    if (pa > 0) {
      ctx.font = `10px ${MONO}`;
      const text = `ДОПУСК · ${sideName.toUpperCase()}`;
      const tw = Array.from(text).reduce((s, ch) => s + charW(ctx, ch), 0) + 1.4 * (text.length - 1);
      const w = 10 + 6 + 7 + tw + 10 + 2, h = 10 * 1.5 + 12 + 2;
      const right = c.x + c.w - ((VB.w - geo.x(SIGNAL) + 14) / VB.w) * c.w;
      const y0 = c.y + ((dir > 0 ? geo.y(geo.zoneTop) - 72 : geo.y(geo.zoneBot) + 26) / VB.h) * c.h + 8 * (1 - ease(seg(t, 1.6, 2.2)));
      ctx.globalAlpha = pa;
      rr(ctx, right - w, y0, w, h, h / 2);
      ctx.fillStyle = PILL_BG; ctx.fill();
      ctx.strokeStyle = hslVarA(P.accent, 0.7); ctx.stroke();
      ctx.fillStyle = P.accent;
      ctx.beginPath(); ctx.arc(right - w + 11 + 3, y0 + h / 2, 3, 0, Math.PI * 2); ctx.fill();
      ctx.textBaseline = 'middle';
      spaced(ctx, text, right - w + 11 + 6 + 7, y0 + h / 2 + 0.5, 1.4);
      ctx.globalAlpha = 1;
    }
    ctx.restore(); // конец графика

    // боковая панель: вердикт в Telegram
    const ta = show(ease(seg(t, 2.6, 3.4)));
    if (ta > 0) {
      const b = this.toast, dy = 16 * (1 - ease(seg(t, 2.6, 3.4)));
      ctx.globalAlpha = ta;
      rr(ctx, b.x + 0.5, b.y + dy + 0.5, b.w - 1, b.h - 1, 10);
      ctx.fillStyle = TOAST_BG; ctx.fill();
      ctx.strokeStyle = P.border; ctx.stroke();
      ctx.font = `9px ${MONO}`;
      ctx.fillStyle = P.muted;
      ctx.textBaseline = 'alphabetic';
      spaced(ctx, 'TELEGRAM · СЕРГЕЙ ТЁ', b.x + 13, b.y + dy + 1 + 10 + 10, 1.26);
      ctx.font = `13px ${SERIF}`;
      ctx.fillStyle = P.fg;
      this.toastLines.forEach((ln, i) => ctx.fillText(ln, b.x + 13, b.y + dy + 1 + 10 + 13.5 + 6 + 13 + i * 18.2));
      ctx.globalAlpha = 1;
    }
    // кнопка СТАРТ: курсор нажимает, по кнопке расходится круг, текст меняется
    const st = this.start;
    const started = t >= 8.4;
    ctx.globalAlpha = 0.35 + 0.65 * fade;
    rr(ctx, st.x + 0.5, st.y + 0.5, st.w - 1, st.h - 1, 10);
    if (started) { ctx.fillStyle = P.accent; ctx.fill(); }
    ctx.strokeStyle = hslVarA(P.accent, 0.7); ctx.stroke();
    const rp = seg(t, 8.4, 9.2);
    if (rp > 0 && rp < 1) {
      ctx.save();
      rr(ctx, st.x, st.y, st.w, st.h, 10); ctx.clip();
      ctx.globalAlpha = (0.35 + 0.65 * fade) * (1 - rp);
      ctx.fillStyle = hslVarA(P.accent, 0.45);
      ctx.beginPath(); ctx.arc(st.x + st.w / 2, st.y + st.h / 2, 110 * (0.2 + rp * 1.6), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 0.35 + 0.65 * fade;
    }
    ctx.font = `11px ${MONO}`;
    ctx.fillStyle = started ? '#111' : P.accent;
    ctx.textBaseline = 'middle';
    spaced(ctx, started ? 'СДЕЛКУ ВЕДЁТ СОВЕТНИК' : 'СТАРТ', st.x + st.w / 2, st.y + st.h / 2 + 0.5, 1.76, 'center');
    ctx.globalAlpha = 1;
    // Risk Sentinel
    const sa = show(ease(seg(t, 9.6, 10.3)));
    if (sa > 0) {
      const b = this.sentinel, dy = 10 * (1 - ease(seg(t, 9.6, 10.3)));
      ctx.globalAlpha = sa;
      ctx.font = `12px ${SERIF}`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = P.accent;
      ctx.fillText('✓', b.x, b.y + dy + 13);
      ctx.fillStyle = P.muted;
      this.sentinelLines.forEach((ln, i) => ctx.fillText(ln, b.x + 16, b.y + dy + 13 + i * 18));
      ctx.globalAlpha = 1;
    }
    ctx.restore(); // конец окна

    // курсор: из-под графика к точке входа, потом к кнопке
    const W = c.w, H = c.h, ox = c.x, oy = c.y;
    const cIn = ease(seg(t, 4.6, 5.2)), toEntry = ease(seg(t, 5, 6.2)), toBtn = ease(seg(t, 7, 8.2));
    const ex = ox + (px(geo.x(ENTRY) - 6) - c.x), ey = oy + (py(geo.y(geo.entry)) - c.y);
    const sx = ox + W * 0.62, sy = oy + H * 0.95;
    const bx = st.x + st.w * 0.5, bY = st.y + st.h * 0.55;
    const cxp = sx + (ex - sx) * toEntry + (bx - ex) * toBtn;
    const cyp = sy + (ey - sy) * toEntry + (bY - ey) * toBtn;
    const press = seg(t, 6.2, 6.5) > 0 && t < 6.6 ? 0.85 : seg(t, 8.3, 8.6) > 0 && t < 8.7 ? 0.85 : 1;
    const ca = cIn * (1 - seg(t, 9, 9.6)) * fade;
    if (ca > 0) {
      ctx.save();
      ctx.globalAlpha = ca;
      ctx.translate(cxp + 3.7, cyp + 1.8);
      ctx.scale(press * (22 / 24), press * (22 / 24));
      ctx.translate(-4, -2);
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = '#fff'; ctx.fill(cursorPath());
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#111'; ctx.lineWidth = 1.2; ctx.stroke(cursorPath());
      ctx.restore();
    }

    const phase = t < 4.6 ? 0 : t < 9 ? 1 : 2;
    const from = [0, 4.6, 9][phase], to = [4.6, 9, 16.4][phase];
    return { phase, progress: seg(t, from, to) };
  }
}

/** rgba() из строки rgba(r,g,b,1) с другой прозрачностью */
function hslVarA(rgba: string, a: number) {
  return rgba.replace(/,\s*[\d.]+\)$/, `,${a})`);
}

export { CYCLE };
