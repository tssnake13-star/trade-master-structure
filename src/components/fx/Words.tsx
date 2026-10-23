import { Children, cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react';

/**
 * Заголовок по словам (23.10.2026, апгрейд анимации главной; приём по мотивам Magic UI «Blur Fade»
 * и Aceternity «Text Generate Effect»). Каждое слово попадает в свой <span class="fx-word">,
 * а раздел проявляет слова по очереди: стили в fx.css, запуск в useLandingFx.
 *
 * Текст при этом не меняется: те же слова и те же пробелы, поэтому боты и поиск читают заголовок
 * как раньше. Вложенные <em>, <span> и <br/> сохраняются со своими классами.
 */
export default function Words({ children }: { children: ReactNode }) {
  const counter = { n: 0 };
  return <>{split(children, counter)}</>;
}

function split(node: ReactNode, c: { n: number }): ReactNode {
  return Children.map(node, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      return String(child)
        .split(/(\s+)/)
        .map((part, i) => {
          if (!part) return null;
          if (/^\s+$/.test(part)) return part;
          const style = { '--w': c.n++ } as CSSProperties;
          return <span key={i} className="fx-word" style={style}>{part}</span>;
        });
    }
    if (isValidElement(child)) {
      const el = child as ReactElement<{ children?: ReactNode }>;
      if (el.type === 'br' || el.props.children === undefined) return el;
      return cloneElement(el, undefined, split(el.props.children, c));
    }
    return child;
  });
}
