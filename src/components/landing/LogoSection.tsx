import logoFull from '@/assets/logo-full.png';

const LogoSection = () => {
  return (
    <section className="py-16 md:py-20 bg-background">
      <div className="container-landing flex justify-center">
        <img 
          src={logoFull} 
          alt="TRADELIKETYO" 
          className="w-32 h-32 md:w-40 md:h-40 object-contain"
        />
      </div>
    </section>
  );
};

export default LogoSection;
