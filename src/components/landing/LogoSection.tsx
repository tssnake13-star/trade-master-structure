import logoFull from '@/assets/logo-full.png';

const LogoSection = () => {
  return (
    <section className="py-8 md:py-10 bg-background">
      <div className="container-landing flex justify-center">
        <img 
          src={logoFull} 
          alt="TRADELIKETYO" 
          className="w-96 h-96 md:w-[30rem] md:h-[30rem] object-contain"
        />
      </div>
    </section>
  );
};

export default LogoSection;
