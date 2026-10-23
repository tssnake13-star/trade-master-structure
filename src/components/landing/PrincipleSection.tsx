const PrincipleSection = () => {
  return (
    <section id="principle" className="py-16 md:py-28">
      <div className="container-landing">
        <div className="max-w-3xl">
          <span className="section-label">Главный принцип</span>
          {/* 23.10.2026: маркер под «умеет остановиться» снят (Сергей: «желтая какая-то рамка… портит весь вид»),
              золото — с обликом, шаг 1; проявление по словам — с обликом, шаг 4 */}
          <p className="text-2xl md:text-4xl leading-tight tracking-tight text-foreground">
            Профессионал отличается не анализом. А тем, что умеет остановиться. Когда система говорит «нет» — он не входит.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PrincipleSection;
