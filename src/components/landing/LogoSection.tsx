import promoVideoFallback from '@/assets/promo-video.mp4';
import { useSiteAsset, SITE_ASSET_KEYS } from '@/hooks/useSiteAsset';

const LogoSection = () => {
  const promoVideo = useSiteAsset(SITE_ASSET_KEYS.promoVideo, promoVideoFallback);

  return (
    <section className="py-8 md:py-12 bg-background">
      <div className="container-landing flex justify-center">
        <video
          key={promoVideo}
          src={promoVideo}
          autoPlay
          muted
          loop
          playsInline
          className="w-full max-w-3xl rounded-xl"
        />
      </div>
    </section>
  );
};

export default LogoSection;
