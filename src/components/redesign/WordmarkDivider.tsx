import { FC } from 'react';

interface Props {
  text: string;
  emphasis?: string;
  id?: string;
}

/**
 * Full-bleed editorial wordmark divider — Fraunces, large, low-contrast.
 * Used as a typographic break between sections.
 */
const WordmarkDivider: FC<Props> = ({ text, emphasis, id }) => {
  return (
    <section id={id} className="py-20 md:py-32 border-y border-[hsl(var(--rule-soft))]">
      <div className="container-landing">
        <p className="wordmark text-center select-none">
          {text}
          {emphasis && (
            <>
              {' '}
              <em>{emphasis}</em>
            </>
          )}
        </p>
      </div>
    </section>
  );
};

export default WordmarkDivider;