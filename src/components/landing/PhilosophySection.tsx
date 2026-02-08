const PhilosophySection = () => {
  return (
    <section className="py-12 md:py-20 bg-card/50">
      <div className="container-landing">
        <div className="max-w-3xl">
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
            Десять лет назад я сделал выбор в пользу{' '}
            <span className="font-semibold text-foreground">независимости</span>,
            отказавшись от работы в рамках массовых образовательных проектов
            ради создания собственного торгового протокола. Для меня было важнее
            сохранить право на честную, сухую методологию, чем следовать рыночным
            шаблонам. Это время стало фильтром качества: я отсек информационный шум,
            создав{' '}
            <span className="font-semibold text-foreground">Trade OS</span> —
            систему, основанную на жёсткой{' '}
            <span className="font-semibold text-foreground">архитектуре</span>{' '}
            принятия решений, проверенной годами личной практики.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PhilosophySection;
