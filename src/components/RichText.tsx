import { Fragment } from 'react';

/**
 * RichText — вывод многострочного текста из админки так, как его набирали.
 *
 * В базу описание попадает с переводами строк (в админке это textarea), но HTML
 * их игнорирует — поэтому длинное описание выглядело одним монолитным куском.
 * Здесь пустая строка разбивает текст на абзацы, одиночный перевод строки
 * остаётся переводом строки.
 *
 * Пример:
 *   Первый абзац.
 *                     ← пустая строка = новый абзац
 *   Второй абзац,
 *   с переносом внутри.
 */
export default function RichText({
  text,
  className,
  style,
  gap = '0.7em',
}: {
  text: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
  /** отступ между абзацами */
  gap?: string;
}) {
  if (!text) return null;

  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  // если абзацев нет (текст в одну строку) — отдаём как обычный абзац
  if (paragraphs.length === 0) return null;

  return (
    <>
      {paragraphs.map((p, i) => (
        // у первого абзаца отступ не трогаем — его задаёт вызывающий код (className/style)
        <p key={i} className={className} style={{ ...style, marginTop: i === 0 ? style?.marginTop : gap }}>
          {p.split('\n').map((line, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </p>
      ))}
    </>
  );
}
