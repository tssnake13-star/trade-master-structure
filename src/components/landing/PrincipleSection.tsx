const PrincipleSection = () => {
  return (
    <section id="principle" className="section-animate py-16 md:py-28">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">Главный принцип</span>
          <p className="font-['Bricolage_Grotesque'] text-2xl md:text-4xl leading-tight tracking-tight text-foreground">
            Профессионал отличается не анализом. А тем, что <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>умеет остановиться</em>. Когда система говорит «нет» — он не входит.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PrincipleSection;
