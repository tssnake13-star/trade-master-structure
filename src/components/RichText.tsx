import { Fragment } from 'react';

/**
 * RichText — вывод многострочного текста из админки так, как его набирали.
 *
 * 1. Абзацы: пустая строка разбивает текст на абзацы, одиночный перевод строки
 *    остаётся переносом. (В базу описание попадает с переводами строк, но HTML
 *    их игнорирует — без этого длинный текст выглядел монолитом.)
 * 2. Ссылки: адреса в тексте становятся кликабельными.
 *
 * Текст вставляется как обычные React-элементы, без dangerouslySetInnerHTML —
 * поэтому разметку или скрипт через описание протащить нельзя.
 */

// Домены, которые считаем ссылкой, когда адрес написан без https:// и без www —
// именно так их обычно и пишут в описании: tradeliketyo.com/kurs, t.me/канал.
// Список нужен, чтобы не превращать в ссылки обычные слова с точкой («Node.js»,
// «файл.pdf»); кириллица сюда не попадает, поэтому «и т.д.» тоже безопасно.
const TLD =
  'com|ru|org|net|io|me|dev|app|pro|info|biz|tv|online|site|store|club|life|team|space|tech|digital|studio|agency|trade|money|capital|xyz|top|su|ua|kz|by|uk|de|fr|es|it|pl|cz|tr|ge|am|md|lv|lt|ee|fi|se|no|nl|ch|at|be|pt|gr|jp|cn|kr|in|br|mx|ar|au|ca|us|co|ai|cc|to|ly';

// Порядок важен: сначала почта (иначе домен внутри адреса стал бы отдельной
// ссылкой), затем адреса с протоколом, затем «голые» домены.
const URL_RE = new RegExp(
  '(' +
    '[\\w.+-]+@[a-z0-9-]+(?:\\.[a-z0-9-]+)*\\.[a-z]{2,}' +
    '|(?:https?:\\/\\/|www\\.)[^\\s<>«»]+' +
    '|[a-z0-9][a-z0-9-]*(?:\\.[a-z0-9-]+)*\\.(?:' + TLD + ')(?:\\/[^\\s<>«»]*)?' +
  ')',
  'gi',
);
const TRAILING = /[.,;:!?)»"'\]]+$/;

function linkify(text: string, linkColor: string) {
  const parts = text.split(URL_RE);
  return parts.map((part, i) => {
    if (!part) return null;
    // нечётные индексы — совпадения регулярки (ссылки)
    if (i % 2 === 1) {
      const trailing = (part.match(TRAILING) || [''])[0];
      const url = trailing ? part.slice(0, -trailing.length) : part;
      const isEmail = /^[^\s@]+@[^\s@]+$/.test(url);
      const href = isEmail
        ? `mailto:${url}`
        : /^https?:\/\//i.test(url)
          ? url
          : `https://${url}`;
      return (
        <Fragment key={i}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: linkColor, textDecoration: 'underline', textUnderlineOffset: 2, wordBreak: 'break-word' }}
          >
            {url}
          </a>
          {trailing}
        </Fragment>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export default function RichText({
  text,
  className,
  style,
  gap = '0.7em',
  linkColor = '#e1a84d',
}: {
  text: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
  /** отступ между абзацами */
  gap?: string;
  /** цвет ссылок — по умолчанию фирменное золото кабинета */
  linkColor?: string;
}) {
  if (!text) return null;

  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  return (
    <>
      {paragraphs.map((p, i) => (
        // у первого абзаца отступ не трогаем — его задаёт вызывающий код (className/style)
        <p key={i} className={className} style={{ ...style, marginTop: i === 0 ? style?.marginTop : gap }}>
          {p.split('\n').map((line, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {linkify(line, linkColor)}
            </Fragment>
          ))}
        </p>
      ))}
    </>
  );
}
