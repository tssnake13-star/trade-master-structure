const sharp = require('sharp');

const U = '/root/.claude/uploads/0726fffc-ce6e-5d4b-af9c-689cb46b36aa/';
const OUT = '/home/user/trade-master-structure/.carousel/assets/';

(async () => {
  // ---- LOGO: key out black background -> transparent, trim ----
  const logoSrc = U + '326b36b6-IMG_6547.jpeg';
  const { data, info } = await sharp(logoSrc).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += ch, j += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const l = Math.max(r, g, b);
    let a;
    if (l < 22) a = 0;
    else if (l > 50) a = 255;
    else a = Math.round(((l - 22) / 28) * 255);
    out[j] = r; out[j + 1] = g; out[j + 2] = b; out[j + 3] = a;
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png().trim({ threshold: 1 })
    .toFile(OUT + 'logo.png');
  const lm = await sharp(OUT + 'logo.png').metadata();
  console.log('logo.png', lm.width + 'x' + lm.height);

  // Emblem-only crop (just the diamond + bull/bear, drop wordmark) for small footer mark
  // wordmark sits in bottom ~22% -> crop top 78%
  const top = await sharp(OUT + 'logo.png').metadata();
  await sharp(OUT + 'logo.png')
    .extract({ left: 0, top: 0, width: top.width, height: Math.round(top.height * 0.74) })
    .trim({ threshold: 1 })
    .toFile(OUT + 'emblem.png');
  const em = await sharp(OUT + 'emblem.png').metadata();
  console.log('emblem.png', em.width + 'x' + em.height);

  // ---- PHOTO: keep COLOR, tone-map so the dark figure reads on dark bg ----
  const photo = U + 'e6e7d5fe-IMG_5804.jpeg';
  await sharp(photo)
    .resize({ width: 1000 })
    .normalise()                                  // stretch histogram to full range
    .linear(1.12, 4)                              // gentle contrast + lift
    .modulate({ brightness: 1.5, saturation: 1.25 }) // brighten + richer color
    .gamma(1.12)
    .toColourspace('srgb')
    .png()
    .toFile(OUT + 'portrait.png');
  console.log('portrait.png done (color)');
})();
