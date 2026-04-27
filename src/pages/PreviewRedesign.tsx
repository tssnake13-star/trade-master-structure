import { Link } from 'react-router-dom';
import Index from './Index';

/**
 * /preview-redesign
 *
 * Renders the live landing page (Index) wrapped in [data-preview-skin]
 * so all visual upgrades from the design document are layered on top
 * without touching the production landing.
 */
const PreviewRedesign = () => {
  return (
    <div data-preview-skin className="min-h-screen bg-background text-foreground">
      <div className="pv-banner">
        <span className="pv-banner__label">Preview · Redesign draft</span>
        <nav className="pv-banner__nav">
          <Link to="/" className="pv-banner__link">← Текущий сайт</Link>
          <a
            href="#"
            className="pv-banner__link pv-banner__link--primary"
            onClick={(e) => {
              e.preventDefault();
              alert(
                'Когда финальная версия одобрена, подтвердите в чате — применю превью к боевому /'
              );
            }}
          >
            Применить
          </a>
        </nav>
      </div>
      <Index />
    </div>
  );
};

export default PreviewRedesign;
