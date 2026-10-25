/**
 * «Живые» мониторы сцены первого экрана: свечи идут в реальном времени, цена ходит
 * в накоплении, выходит из него, терминал отмечает зону и уровень и присылает карточку
 * «допуск» или «отказ». 22.10.2026, Сергей: «один раз появилась, и всё… эффекта вау нету…
 * добавить цикличность, чтобы постоянно что-то происходило», потом «плавно… 60 кадров».
 *
 * ⚠️ Только свечи, уровни и зоны накопления — индикаторов нет (Сергей 21.10.2026).
 * ⚠️ Карточки — иллюстрация того, как работает терминал: без цен, тейков и процентов.
 *
 * 23.10.2026, Сергей: «края монитора неровные… график находит на рамки… мониторы должны быть
 * безрамочные… широкоформатные, как на исходнике… картинка как будто виртуальная, надо как реальная».
 * Мониторы на его кадре изогнутые, а график раньше натягивался на плоский четырёхугольник —
 * отсюда и неровные края. Теперь у каждого экрана свой контур по замерам кадра (верх и низ —
 * параболы), график идёт по изгибу, шаг свечей растёт к ближнему краю, как в перспективе.
 * Экран занимает всю лицевую сторону монитора: снаружи остаётся только волосок тёмного стекла.
 * Чтобы картинка выглядела снятой, а не нарисованной: мягкое свечение свечей, сетка, блик стекла,
 * затемнение к краям и зерно.
 * 23.10.2026, Сергей: «графики должны полностью заполнять мониторы… не должно быть этих полей с чёрточками
 * сверху, снизу, на правой боковой». Панель сверху, шкала цены справа и шкала времени снизу сняты: свечи
 * идут во весь экран, свеча, уезжающая за левый край, обрезается по контуру экрана.
 *
 * 25.10.2026: живой график остался на правом мониторе, на левом — снимок настоящего терминала (drawShot).
 *
 * Рисуется на canvas в координатах картинки (1672×941): вызывающий уже выставил ctx.setTransform.
 */

export type Pt = [number, number];
/** y = a·x² + b·x + c, в координатах кадра */
export type Curve = [number, number, number];
export type ScreenDef = {
  /** левый и правый край лицевой стороны */
  x0: number;
  x1: number;
  /** верхний и нижний край лицевой стороны */
  top: Curve;
  bot: Curve;
  /** нижний край дополнительно опускается вправо (подбородок ближе к камере толще), px на px */
  chin?: number;
};
type Candle = { o: number; h: number; l: number; c: number; id: number };
type Zone = { from: number; to: number; top: number; bottom: number; born: number; ok: boolean; level: number };
export type LiveEvent = { ok: boolean; dir: 1 | -1 };

const UP = '#e9c793';
const DOWN = '#748093';
// поле графика в долях экрана (u — по ширине, v — по высоте): во весь экран, по вертикали небольшой воздух
const U0 = 0.008, U1 = 0.985, V0 = 0.06, V1 = 0.94;

const yq = (c: Curve, x: number) => c[0] * x * x + c[1] * x + c[2];

export type Screen = {
  map: (u: number, v: number) => Pt;
  /** вся лицевая сторона монитора */
  face: Path2D;
  /** светящаяся часть: лицевая сторона без тонкого края */
  active: Path2D;
  /** та же лицевая сторона строкой для SVG (заглушка «выключено», кромка во вступлении) */
  svg: string;
  topEdge: Path2D;
  /** корпус перед кольцом: лицевая сторона с кромкой (сверху и по бокам 3 px кадра, снизу 5 px) */
  body: Path2D;
};

/** контуры и отображение (u, v) → точка кадра для изогнутого экрана */
export function makeScreen(d: ScreenDef, inset = 2.2): Screen {
  const top = (x: number) => yq(d.top, x);
  const bot = (x: number) => yq(d.bot, x) + (d.chin ?? 0) * (x - d.x0);

  // равные доли настоящего экрана выглядят шире там, где экран ближе к камере (он там выше):
  // u считается по интегралу 1 / высота, тогда шаг свечей растёт к ближнему краю
  const N = 160;
  const ax0 = d.x0 + inset, ax1 = d.x1 - inset;
  const xs: number[] = [];
  const us: number[] = [];
  let acc = 0;
  for (let i = 0; i <= N; i++) {
    const x = ax0 + ((ax1 - ax0) * i) / N;
    if (i > 0) {
      const xm = x - (ax1 - ax0) / N / 2;
      acc += 1 / (bot(xm) - top(xm));
    }
    xs.push(x);
    us.push(acc);
  }
  for (let i = 0; i <= N; i++) us[i] /= acc;
  const xAt = (u: number) => {
    if (u <= 0) return ax0 + u * ((xs[1] - xs[0]) / (us[1] - us[0]));
    if (u >= 1) return ax1 + (u - 1) * ((xs[N] - xs[N - 1]) / (us[N] - us[N - 1]));
    let lo = 0, hi = N;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (us[mid] <= u) lo = mid; else hi = mid;
    }
    const k = (u - us[lo]) / (us[hi] - us[lo]);
    return xs[lo] + (xs[hi] - xs[lo]) * k;
  };
  const map = (u: number, v: number): Pt => {
    const x = xAt(u);
    const t = top(x) + inset, b = bot(x) - inset;
    return [x, t + (b - t) * v];
  };

  const ring = (x0: number, x1: number, dy: number) => {
    const pts: Pt[] = [];
    const n = 64;
    for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n; pts.push([x, top(x) + dy]); }
    for (let i = n; i >= 0; i--) { const x = x0 + ((x1 - x0) * i) / n; pts.push([x, bot(x) - dy]); }
    return pts;
  };
  const toPath = (pts: Pt[], close = true) => {
    const p = new Path2D();
    pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    if (close) p.closePath();
    return p;
  };
  const facePts = ring(d.x0, d.x1, 0);
  // 24.10.2026: кромка корпуса под экраном толщиной ~4 px кадра — на неё ложились свет и дымка кольца
  const clampX = (x: number) => Math.min(Math.max(x, d.x0), d.x1);
  const bodyPts: Pt[] = [];
  for (let i = 0; i <= 64; i++) { const x = d.x0 - 3 + ((d.x1 - d.x0 + 6) * i) / 64; bodyPts.push([x, top(clampX(x)) - 3]); }
  for (let i = 64; i >= 0; i--) { const x = d.x0 - 3 + ((d.x1 - d.x0 + 6) * i) / 64; bodyPts.push([x, bot(clampX(x)) + 5]); }
  const activePts = ring(ax0, ax1, inset);
  const topPts: Pt[] = [];
  for (let i = 0; i <= 64; i++) {
    const x = d.x0 + 1 + ((d.x1 - d.x0 - 2) * i) / 64;
    topPts.push([x, top(x) + 0.6]);
  }
  // Path2D есть только в браузере, а страница для ботов собирается на сервере:
  // контуры создаются при первом обращении, строка для SVG — чистая математика
  let face: Path2D | null = null, active: Path2D | null = null, edge: Path2D | null = null, body: Path2D | null = null;
  return {
    map,
    get face() { return (face ??= toPath(facePts)); },
    get active() { return (active ??= toPath(activePts)); },
    get topEdge() { return (edge ??= toPath(topPts, false)); },
    get body() { return (body ??= toPath(bodyPts)); },
    svg: 'M' + facePts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + 'Z',
  };
}

// зерно — один раз на всю страницу: мелкий шум, который кладётся поверх экранов
let grainTile: HTMLCanvasElement | null = null;
function grain() {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const g = c.getContext('2d');
  if (g) {
    const img = g.createImageData(96, 96);
    let s = 7;
    for (let i = 0; i < img.data.length; i += 4) {
      s = (s * 16807) % 2147483647;
      const v = 128 + ((s / 2147483647) - 0.5) * 120;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }
  grainTile = c;
  return c;
}

/** стекло экрана: блик, затемнение к краям, зерно, свет на верхней кромке — одно на живой график и на снимок */
export function drawGlass(ctx: CanvasRenderingContext2D, sc: Screen) {
  ctx.save();
  ctx.clip(sc.active);
  const g0 = sc.map(0.05, 0), g1 = sc.map(0.75, 1);
  const sheen = ctx.createLinearGradient(g0[0], g0[1], g1[0], g1[1]);
  sheen.addColorStop(0, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.32, 'rgba(255,255,255,0.045)');
  sheen.addColorStop(0.42, 'rgba(255,255,255,0.012)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fill(sc.active);
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 14;
  ctx.stroke(sc.active);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 5;
  ctx.stroke(sc.active);
  const pat = ctx.createPattern(grain(), 'repeat');
  if (pat) {
    ctx.globalAlpha = 0.045;
    ctx.fillStyle = pat;
    ctx.fill(sc.active);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  ctx.strokeStyle = 'rgba(205,190,165,0.32)';
  ctx.lineWidth = 0.8;
  ctx.stroke(sc.topEdge);
}

/**
 * Экран со снимком вместо живого графика. 25.10.2026, Сергей: «нужен реальный скрин… не нарисованный… то, что
 * реально человек увидит» — на левом мониторе настоящий терминал ECHO-GATE INSIDE, снятый с сайта. Снимок заранее
 * натянут на изогнутый экран (scratchpad/make_hero_terminal.py, та же раскладка, что у графиков в makeScreen) и лежит
 * в рамке box кадра; пока картинка не пришла, экран тёмный.
 */
export function drawShot(ctx: CanvasRenderingContext2D, sc: Screen, img: CanvasImageSource | null, box: { x: number; y: number; w: number; h: number }) {
  ctx.fillStyle = '#040507';
  ctx.fill(sc.face);
  if (!img) return;
  ctx.save();
  ctx.clip(sc.active);
  ctx.drawImage(img, box.x, box.y, box.w, box.h);
  ctx.restore();
}

export class LiveScreen {
  private candles: Candle[] = [];
  private zones: Zone[] = [];
  private nextId = 0;
  private mode: 'range' | 'trend' = 'range';
  private left = 9;
  private dir: 1 | -1 = 1;
  private center = 0;
  private rangeFrom = 0;
  private fakeOut = 0;
  private live: { start: number; target: number; seed: number } | null = null;
  private lo = 0;
  private hi = 1;
  private rnd: () => number;
  // неподвижная часть интерфейса строится один раз: экран на кадре не двигается
  private chromeGrid = new Path2D();

  constructor(
    private screen: Screen,
    private n: number,
    private candleMs: number,
    seed: number,
    private onEvent: (e: LiveEvent) => void,
  ) {
    let s = seed;
    this.rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    // история: спуск, накопление, выход — чтобы экран сразу был «рабочим»
    let p = 0;
    this.center = p;
    for (let i = 0; i < n; i++) p = this.push(p, true);
    // экран открывается на конце накопления: первая карточка появляется через пару секунд
    this.mode = 'range';
    this.center = p;
    this.rangeFrom = this.nextId - 7;
    this.left = 2 + Math.floor(this.rnd() * 4);
    this.lo = Math.min(...this.candles.map((k) => k.l));
    this.hi = Math.max(...this.candles.map((k) => k.h));
    this.buildGrid();
  }

  private quad(path: Path2D, u0: number, v0: number, u1: number, v1: number) {
    const m = this.screen.map;
    let p = m(u0, v0); path.moveTo(p[0], p[1]);
    p = m(u1, v0); path.lineTo(p[0], p[1]);
    p = m(u1, v1); path.lineTo(p[0], p[1]);
    p = m(u0, v1); path.lineTo(p[0], p[1]);
    path.closePath();
  }

  private seg(path: Path2D, u0: number, v0: number, u1: number, v1: number, steps = 1) {
    const m = this.screen.map;
    let p = m(u0, v0); path.moveTo(p[0], p[1]);
    for (let i = 1; i <= steps; i++) {
      const k = i / steps;
      p = m(u0 + (u1 - u0) * k, v0 + (v1 - v0) * k);
      path.lineTo(p[0], p[1]);
    }
  }

  /** тонкая сетка во весь экран — единственное, что осталось от интерфейса терминала */
  private buildGrid() {
    for (let v = 0.12; v < 1; v += 0.135) this.seg(this.chromeGrid, 0, v, 1, v, 12);
    for (let k = 0.05; k < 1; k += 0.105) this.seg(this.chromeGrid, k, 0, k, 1, 6);
  }

  private gauss() {
    return (this.rnd() + this.rnd() + this.rnd() - 1.5) * 1.15;
  }

  private nextClose(prev: number): number {
    if (this.mode === 'range') {
      if (this.fakeOut > 0) {
        this.fakeOut--;
        return prev + (this.center - prev) * 0.7 + this.gauss() * 0.3;
      }
      return prev + (this.center - prev) * 0.32 + this.gauss() * 0.9;
    }
    return prev + this.dir * (0.75 + this.rnd() * 0.5) + this.gauss() * 0.55;
  }

  private push(prev: number, quiet = false): number {
    const c = this.nextClose(prev);
    this.addCandle(prev, c);
    this.advanceRegime(c, quiet);
    return c;
  }

  private addCandle(o: number, c: number) {
    const w = 0.25 + this.rnd() * 0.7;
    this.candles.push({ o, c, h: Math.max(o, c) + w * this.rnd(), l: Math.min(o, c) - w * this.rnd(), id: this.nextId++ });
    if (this.candles.length > this.n) this.candles.shift();
  }

  private advanceRegime(c: number, quiet: boolean) {
    if (--this.left > 0) return;
    if (this.mode === 'range') {
      const span = this.candles.filter((k) => k.id >= this.rangeFrom);
      const top = Math.max(...span.map((k) => k.h)), bottom = Math.min(...span.map((k) => k.l));
      // каждый третий выход — ложный: система говорит «отказ», цена возвращается в коридор
      const ok = quiet || this.rnd() > 0.34;
      this.dir = this.rnd() > 0.45 ? 1 : -1;
      if (!quiet) {
        this.zones.push({ from: this.rangeFrom, to: this.nextId, top, bottom, born: performance.now(), ok, level: this.dir > 0 ? top : bottom });
        this.onEvent({ ok, dir: this.dir });
      }
      if (ok) {
        this.mode = 'trend';
        this.left = 4 + Math.floor(this.rnd() * 3);
      } else {
        this.fakeOut = 2;
        this.left = 4 + Math.floor(this.rnd() * 3);
        const last = this.candles[this.candles.length - 1];
        if (this.dir > 0) last.h = Math.max(last.h, top + 0.9); else last.l = Math.min(last.l, bottom - 0.9);
      }
    } else {
      this.mode = 'range';
      this.center = c;
      this.rangeFrom = this.nextId;
      this.left = 6 + Math.floor(this.rnd() * 4);
    }
  }

  /** поторопить конец накопления: карточки не должны пропадать надолго */
  nudge() {
    if (this.mode === 'range' && this.left > 1 && this.fakeOut === 0) this.left = 1;
  }

  /**
   * Неподвижная подложка экрана: тёмное стекло, матрица, сетка.
   * Рисуется один раз в заготовку (при смене размера), в кадре её только копируют.
   */
  drawUnder(ctx: CanvasRenderingContext2D) {
    const sc = this.screen;
    ctx.fillStyle = '#040507';
    ctx.fill(sc.face);
    const pT = sc.map(0.5, 0), pB = sc.map(0.5, 1);
    const bg = ctx.createLinearGradient(pT[0], pT[1], pB[0], pB[1]);
    bg.addColorStop(0, '#111a26');
    bg.addColorStop(0.55, '#0c121b');
    bg.addColorStop(1, '#0a0e15');
    ctx.fillStyle = bg;
    ctx.fill(sc.active);
    ctx.strokeStyle = 'rgba(150,170,200,0.07)';
    ctx.lineWidth = 0.6;
    ctx.stroke(this.chromeGrid);
  }

  /** неподвижное стекло поверх графика: блик, затемнение к краям, зерно, свет на верхней кромке */
  drawOver(ctx: CanvasRenderingContext2D) {
    drawGlass(ctx, this.screen);
  }

  /** живая часть кадра: зоны, уровни, свечи. dt — сколько прошло с прошлого кадра */
  drawLive(ctx: CanvasRenderingContext2D, now: number, dt: number) {
    // живая свеча: цена плавно идёт к закрытию, свеча закрывается, и сразу начинается следующая
    if (!this.live) this.live = { start: now, target: this.nextClose(this.candles[this.candles.length - 1].c), seed: this.rnd() * 10 };
    let t = (now - this.live.start) / this.candleMs;
    if (t >= 1) {
      const closed = this.live.target;
      this.addCandle(this.candles[this.candles.length - 1].c, closed);
      this.advanceRegime(closed, false);
      const start = t > 3 ? now : this.live.start + this.candleMs;
      this.live = { start, target: this.nextClose(closed), seed: this.rnd() * 10 };
      t = (now - start) / this.candleMs;
    }
    t = Math.max(0, Math.min(1, t));
    const prev = this.candles[this.candles.length - 1].c;
    const wob = Math.sin(t * Math.PI) * Math.sin(this.live.seed) * 0.25;
    const cur = prev + (this.live.target - prev) * (t * t * (3 - 2 * t)) + wob;
    const glide = t; // график всё время плавно едет влево: за время одной свечи — на одну ячейку

    const n = this.candles.length;
    let lo = Math.min(prev, cur), hi = Math.max(prev, cur);
    for (let i = 1; i < n; i++) { const k = this.candles[i]; if (k.l < lo) lo = k.l; if (k.h > hi) hi = k.h; }
    const a = 1 - Math.exp(-dt / 600);
    this.lo += (lo - this.lo) * a;
    this.hi += (hi - this.hi) * a;
    if (this.hi - this.lo < 4) this.hi = this.lo + 4;

    const slot = (U1 - U0) / n;
    const span = this.hi - this.lo;
    const lo0 = this.lo;
    const vy = (p: number) => V1 - ((p - lo0) / span) * (V1 - V0);
    // подложка и стекло — заготовки (drawUnder / drawOver). Поле графика — во весь экран, поэтому свеча,
    // уезжающая влево, и начало зоны обрезаются по контуру экрана, иначе вылезли бы на рамку
    ctx.save();
    ctx.clip(this.screen.active);

    // зоны накопления и уровни
    const firstId = this.candles[1]?.id ?? 0;
    this.zones = this.zones.filter((z) => z.to > firstId - 2);
    let glow = 0;
    const zone = new Path2D(), level = new Path2D(), mark = new Path2D();
    for (const z of this.zones) {
      const u0 = U0 + slot * (z.from - firstId - glide), u1 = U0 + slot * (z.to - firstId - glide);
      if (u1 <= U0 - slot) continue;
      this.quad(zone, Math.max(U0 - slot, u0), vy(z.top), u1, vy(z.bottom));
      const age = (now - z.born) / 1000;
      glow = Math.max(glow, Math.sin(Math.min(1, age / 3.2) * Math.PI));
      if (z.ok) {
        const k = Math.min(1, age / 1.6);
        const reach = k * k * (3 - 2 * k);
        this.seg(level, u1, vy(z.level), u1 + (U1 - u1) * reach, vy(z.level), 8);
        if (age < 3.5) {
          const r = (0.005 + 0.0025 * Math.sin(age * 5)) * Math.sin(Math.min(1, age / 3.5) * Math.PI);
          this.quad(mark, u1 - r, vy(z.level) - r * 2.2, u1 + r, vy(z.level) + r * 2.2);
        }
      }
    }
    ctx.fillStyle = `rgba(201,147,63,${(0.09 + 0.24 * glow).toFixed(3)})`;
    ctx.fill(zone);
    ctx.strokeStyle = `rgba(214,160,74,${(0.22 + 0.55 * glow).toFixed(3)})`;
    ctx.lineWidth = 0.8;
    ctx.stroke(zone);
    ctx.strokeStyle = 'rgba(232,178,100,0.35)';
    ctx.lineWidth = 2.6;
    ctx.stroke(level);
    ctx.strokeStyle = '#eab468';
    ctx.lineWidth = 1.1;
    ctx.stroke(level);
    ctx.fillStyle = '#ffd38a';
    ctx.fill(mark);

    // свечи: сначала мягкое свечение, потом сами свечи — так светится настоящая матрица
    const up = new Path2D(), down = new Path2D(), wu = new Path2D(), wd = new Path2D();
    const add = (k: { o: number; c: number; h: number; l: number }, i: number) => {
      const uc = U0 + slot * (i + 0.5 - glide), bw = slot * 0.3;
      const top = vy(Math.max(k.o, k.c)), bot = Math.max(vy(Math.min(k.o, k.c)), top + 0.004);
      const isUp = k.c >= k.o;
      this.quad(isUp ? up : down, uc - bw, top, uc + bw, bot);
      this.seg(isUp ? wu : wd, uc, vy(k.h), uc, vy(k.l));
    };
    for (let i = 1; i < n; i++) add(this.candles[i], i - 1);
    add({ o: prev, c: cur, h: Math.max(prev, cur) + 0.15, l: Math.min(prev, cur) - 0.15 }, n - 1);
    ctx.globalAlpha = 0.16;
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = UP; ctx.stroke(up); ctx.stroke(wu);
    ctx.strokeStyle = DOWN; ctx.stroke(down);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = UP; ctx.stroke(wu);
    ctx.strokeStyle = DOWN; ctx.stroke(wd);
    ctx.fillStyle = UP; ctx.fill(up);
    ctx.fillStyle = DOWN; ctx.fill(down);
    ctx.restore();
  }
}
