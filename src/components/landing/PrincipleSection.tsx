import Words from '@/components/fx/Words';

const PrincipleSection = () => {
  return (
    <section id="principle" className="section-animate py-16 md:py-28">
      <div className="container-landing">
        <div className="max-w-3xl">
          {/* 29.10.2026: «Главный принцип» — заголовок раздела, а не подпись над цитатой */}
          <h2 className="text-foreground"><Words>Главный принцип</Words></h2>
          {/* 23.10.2026: цитата проявляется по словам медленнее заголовков. Маркер под «умеет остановиться»
              снят в тот же день (Сергей: «желтая какая-то рамка… портит весь вид»), золото — с обликом, шаг 1 */}
          <p data-fx="quote" className="mt-8 text-2xl md:text-[28px] leading-tight tracking-tight text-foreground font-semibold">
            <Words>
              Профессионал отличается не анализом. А тем, что умеет остановиться.
            </Words>
          </p>
          {/* 28.10.2026 (страница «Об авторе»): «Мои лучшие сделки…» переливается бликом */}
          <p className="mt-8 text-base md:text-lg leading-relaxed text-muted-foreground" style={{ maxWidth: '60ch' }}>
            Когда система говорит «нет», он не входит.{' '}
            <span className="cta-shine-text font-medium">Мои лучшие сделки — те, которые я не совершил.</span>{' '}
            Поэтому я не учу угадывать входы. Я выстраиваю систему, которая принимает решение, и вы перестаёте действовать
            на ощущениях.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PrincipleSection;
