/**
 * Объёмное фото первого экрана (23.10.2026, Сергей: «очень хочется 3D-сайт», проба).
 *
 * Кадр рисуется через WebGL: каждая точка сдвигается по своей глубине (карта hero-depth.webp,
 * 1 — ближе, 0 — дальше). Опора — мониторы: они стоят на месте, а кресло и стена с кольцом
 * расходятся в разные стороны, когда ведёшь мышью, наклоняешь телефон или прокручиваешь.
 * Во вступлении — «наезд с трансфокацией», как в кино: мониторы держат размер, кресло уходит
 * назад, стена с кольцом раскрывается.
 *
 * Обратная задача решается несколькими приближениями: для точки экрана ищем точку кадра,
 * которая после сдвига по своей глубине попадает сюда. Края кадра тянутся, а не рвутся.
 *
 * Пар (Сергей 23.10.2026: «нельзя сделать, чтобы туман… тоже двигался?», «это какой-то увлажнитель»):
 * в зелёном канале карты — маска пара вокруг кольца. Там фото «течёт» вверх, как в синемаграфе:
 * точка берёт цвет всё ниже и ниже, два слоя со сдвигом в полпериода сменяют друг друга, и рисунок
 * пара поднимается без рывков. Линия кольца, мониторы и кресло стоят: маски там нет.
 */

export type DepthFrame = {
  /** canvas: размер в пикселях устройства */
  w: number;
  h: number;
  /** кадр → canvas: масштаб и сдвиг в пикселях устройства */
  k: number;
  tx: number;
  ty: number;
  /** сдвиг камеры в пикселях кадра (на глубине 1 относительно опоры) */
  offX: number;
  offY: number;
  /** сила «наезда»: 0 — нет */
  zoom: number;
  /** время пара, секунды */
  time: number;
};

export const IMG_W = 1672;
export const IMG_H = 941;
/** глубина мониторов: они не двигаются */
export const PIVOT = 0.42;
/** точка, вокруг которой идёт «наезд» (центр мониторов), в пикселях кадра */
export const FOCUS = { x: 1200, y: 360 };
/** пар: сдвиг за период (px кадра) и периодов в секунду */
const STEAM_LEN = 56;
const STEAM_RATE = 0.3;
/** клубы пара: насколько они светлее и темнее (доля яркости) */
const STEAM_WISP = 0.14;

const VS = `
attribute vec2 p;
varying vec2 v;
void main() { v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }
`;

// highp: в mediump координаты кадра (до 1672) округляются до пикселя, а шум пара рассыпается в квадраты
const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D img;
uniform sampler2D dep;
uniform vec2 res;
uniform vec3 fit;
uniform vec2 off;
uniform float zoom;
uniform vec2 focus;
uniform float pivot;
uniform float time;
varying vec2 v;
const vec2 SIZE = vec2(${IMG_W}.0, ${IMG_H}.0);
// пар: сдвиг за период (px кадра) и периодов в секунду — подъём около 17 px кадра в секунду
const float STEAM_LEN = ${STEAM_LEN.toFixed(1)};
const float STEAM_RATE = ${STEAM_RATE.toFixed(3)};
const float STEAM_WISP = ${STEAM_WISP.toFixed(3)};

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

vec4 steam(vec2 s, float m) {
  // вверх с медленным покачиванием вбок; рисунок покачивания сам поднимается вместе с паром
  vec2 dir = vec2((noise(s * 0.006 + vec2(0.0, time * 0.05)) - 0.5) * 0.9, -1.0);
  // свой сдвиг фазы у каждого клуба: смена слоёв не идёт по всему пару разом
  float p0 = fract(time * STEAM_RATE + noise(s * 0.004 + 17.0));
  float p1 = fract(p0 + 0.5);
  vec2 a = s - dir * (p0 - 0.5) * STEAM_LEN * m;
  vec2 b = s - dir * (p1 - 0.5) * STEAM_LEN * m;
  // точка-источник вне пара (линия кольца, край монитора) — сдвиг гаснет: чужие пиксели в пар не тянутся
  a = mix(s, a, texture2D(dep, a / SIZE).g);
  b = mix(s, b, texture2D(dep, b / SIZE).g);
  vec4 c = mix(texture2D(img, a / SIZE), texture2D(img, b / SIZE), abs(p0 - 0.5) * 2.0);
  // клубы: пар местами светлее, местами темнее, и этот рисунок поднимается с той же скоростью
  float wisp = noise(s * 0.012 + vec2(0.0, time * 0.2)) * 0.65 + noise(s * 0.03 + vec2(3.1, time * 0.5)) * 0.35;
  c.rgb *= 1.0 + m * STEAM_WISP * (wisp - 0.5) * 2.0;
  return c;
}

void main() {
  vec2 cpx = vec2(v.x, 1.0 - v.y) * res;
  vec2 o = (cpx - fit.yz) / fit.x;
  vec2 s = o;
  for (int i = 0; i < 4; i++) {
    float d = texture2D(dep, clamp(s / SIZE, 0.0, 1.0)).r - pivot;
    s = focus + (o - focus - off * d) / (1.0 + zoom * d);
  }
  s = clamp(s, vec2(0.0), SIZE);
  float inside = step(0.0, o.x) * step(0.0, o.y) * step(o.x, SIZE.x) * step(o.y, SIZE.y);
  float m = texture2D(dep, s / SIZE).g;
  vec4 c;
  if (m > 0.004) c = steam(s, m);
  else c = texture2D(img, s / SIZE);
  gl_FragColor = c * inside;
}
`;

function shader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = url;
  });
}

/** null — WebGL недоступен: остаётся обычное фото */
export function createDepthPhoto(canvas: HTMLCanvasElement, photoUrl: string, depthUrl: string) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false });
  if (!gl) return null;
  const vs = shader(gl, gl.VERTEX_SHADER, VS);
  const fs = shader(gl, gl.FRAGMENT_SHADER, FS);
  const prog = gl.createProgram();
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = u('res'), uFit = u('fit'), uOff = u('off'), uZoom = u('zoom'), uFocus = u('focus'), uPivot = u('pivot'), uTime = u('time');
  gl.uniform1i(u('img'), 0);
  gl.uniform1i(u('dep'), 1);
  gl.uniform2f(uFocus, FOCUS.x, FOCUS.y);
  gl.uniform1f(uPivot, PIVOT);

  const texture = (unit: number, im: HTMLImageElement) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
  };

  let ready = false;
  const whenReady = Promise.all([loadImage(photoUrl), loadImage(depthUrl)]).then(([photo, depth]) => {
    texture(0, photo);
    texture(1, depth);
    ready = true;
  });

  let last = '';
  const draw = (f: DepthFrame) => {
    if (!ready) return false;
    // одинаковый кадр не перерисовываем: в покое сцена ничего не стоит
    const key = `${f.w}|${f.h}|${f.k.toFixed(4)}|${f.tx.toFixed(1)}|${f.ty.toFixed(1)}|${f.offX.toFixed(2)}|${f.offY.toFixed(2)}|${f.zoom.toFixed(4)}|${f.time.toFixed(3)}`;
    if (key === last) return true;
    last = key;
    gl.viewport(0, 0, f.w, f.h);
    gl.uniform2f(uRes, f.w, f.h);
    gl.uniform3f(uFit, f.k, f.tx, f.ty);
    gl.uniform2f(uOff, f.offX, f.offY);
    gl.uniform1f(uZoom, f.zoom);
    gl.uniform1f(uTime, f.time);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    return true;
  };

  return { whenReady, draw, isReady: () => ready };
}
