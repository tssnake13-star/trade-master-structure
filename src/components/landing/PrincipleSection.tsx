import Words from '@/components/fx/Words';

const PrincipleSection = () => {
  return (
    <section id="principle" className="section-animate py-16 md:py-28">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">Главный принцип</span>
          {/* 23.10.2026: цитата проявляется по словам медленнее заголовков. Маркер под «умеет остановиться»
              снят в тот же день, Сергей: «желтая какая-то рамка… портит весь вид» */}
          <p data-fx="quote" className="font-['Bricolage_Grotesque'] text-2xl md:text-4xl leading-tight tracking-tight text-foreground">
            <Words>
              Профессионал отличается не анализом. А тем, что <em className="not-italic" style={{ color: 'hsl(var(--accent))' }}>умеет остановиться</em>. Когда система говорит «нет» — он не входит.
            </Words>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PrincipleSection;
