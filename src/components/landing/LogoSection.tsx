import logoAnimation from '@/assets/logo-animation.mp4';

const LogoSection = () => {
  return (
    <section className="py-8 md:py-12 bg-background">
      <div className="container-landing flex justify-center">
        <video
          key={logoAnimation}
          src={logoAnimation}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="max-h-[70vh] w-auto max-w-full rounded-xl"
        />
      </div>
    </section>
  );
};

export default LogoSection;
