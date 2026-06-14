import promoBottom from '@/assets/promo-bottom.mp4';

const LogoSection = () => {
  return (
    <section className="py-8 md:py-12 bg-background">
      <div className="container-landing flex justify-center">
        <video
          key={promoBottom}
          src={promoBottom}
          autoPlay
          muted
          loop
          playsInline
          className="max-h-[70vh] w-auto max-w-full rounded-xl"
        />
      </div>
    </section>
  );
};

export default LogoSection;
