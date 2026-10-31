import SiteVideo from './SiteVideo';
import poster from '@/assets/site/robots-poster.webp';

/**
 * Ролик «Как работают Hunter_Bot и Risk Sentinel» (31.10.2026, Сергей: «ролик пойдёт на сайт и в бота»).
 * Обложка пока кадр из ролика: отдельной обложки ещё нет.
 */
export default function RobotsVideo() {
  return (
    <div>
      <SiteVideo
        src="/video/hunter-risk.mp4"
        cover={poster}
        coverAlt="Как работают Hunter_Bot и Risk Sentinel. Точку входа ставите вы, дальше роботы"
        coverSize={[1280, 536]}
        label="Смотреть ролик «Как работают Hunter_Bot и Risk Sentinel», 4 минуты 40 секунд"
        time="4:40"
        endTitle="Начните с терминала"
        track="robots_video"
        ratio="1920 / 804"
        wide
      />
      <p className="mt-3 ns-cap">Запись с экрана: вход показан в тестере, на истории, цифры на панели условные.</p>
    </div>
  );
}
