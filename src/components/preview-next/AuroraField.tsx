/**
 * AuroraField — global page backdrop for /preview-next, replacing the
 * constellation. A calm "quiet terminal" look: slow warm/cool aurora glow,
 * a faint chart grid, and a slow horizontal scan line. Pure CSS animation
 * (no per-frame JS / rAF), so it's lighter than the canvas constellation and
 * fully disabled under prefers-reduced-motion.
 */
export default function AuroraField() {
  return (
    <div className="pn-field" aria-hidden>
      <div className="pn-field__grid" />
      <div className="pn-field__blob pn-field__blob--warm" />
      <div className="pn-field__blob pn-field__blob--cool" />
      <div className="pn-field__scan" />
    </div>
  );
}
