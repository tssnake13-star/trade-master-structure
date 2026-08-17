/**
 * WhatYouLearnSection — «13 · Чему вы учитесь».
 *
 * Снимает главное возражение опытного трейдера: «зачем мне чужая стратегия,
 * у меня своя голова». Ответ — учат не стратегии, а конструкции, на которой
 * стратегия держится. Стоит перед тарифами: человек должен понять, за что
 * платит, до того, как увидит цену.
 */

const WhatYouLearnSection = () => {
  return (
    <section id="learn" className="section-animate py-12 md:py-20 bg-card/50">
      <div className="container-landing">
        <div className="max-w-4xl">
          <span className="section-label">13 · Чему вы учитесь</span>
          <h2 className="text-foreground">
            Вы не копируете стратегию — вы разбираете, <em>как она собрана</em>
          </h2>
        </div>

        <div className="mt-8 md:mt-10 grid md:grid-cols-2 gap-6 md:gap-10 max-w-5xl">
          <div>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Сначала осваиваете мою систему как готовый пример: где она разрешает сделку,
              где запрещает и на чём держится каждое решение.
            </p>
            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
              Дальше выбираете сами — торговать по ней или собрать свою на той же конструкции.
            </p>
          </div>

          <div className="p-6 md:p-8 border border-border rounded-xl bg-background">
            <div
              className="font-['Martian_Mono'] text-[10px] uppercase tracking-[0.22em]"
              style={{ color: 'hsl(var(--accent))' }}
            >
              Что остаётся с вами
            </div>
            <p className="mt-4 text-lg md:text-xl text-foreground leading-relaxed">
              Неважно, чьей стратегией вы торгуете.
            </p>
            <p className="mt-2 text-lg md:text-xl text-foreground leading-relaxed">
              Важно, отвечает ли она на <em>эти четыре вопроса</em>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhatYouLearnSection;
