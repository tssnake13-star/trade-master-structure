import room from '@/assets/cabinet/room-blur.webp';

/** Комната за стеклом: первый экран сайта (стол, мониторы, кольцо), размыта заранее — без filter: blur на лету */
export default function Room() {
  return <div className="cv2-room" style={{ backgroundImage: `url(${room})` }} aria-hidden="true" />;
}
