import logoFull from '@/assets/logo-full.png';

const LogoSection = () => {
  return (
    <section className="pt-0 pb-2 md:pt-0 md:pb-2 bg-background">
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
