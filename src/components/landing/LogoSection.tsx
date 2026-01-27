import promoVideo from '@/assets/promo-video.mp4';

const LogoSection = () => {
  return (
    <section className="py-8 md:py-12 bg-background">
      <div className="container-landing flex justify-center">
        <video 
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
