import { ArrowRight, TrendingUp, User, AlertCircle } from 'lucide-react';
import { TELEGRAM_LINKS } from '@/lib/constants';

const cases = [
  {
    name: 'Андрей',
    result: '5 лет в минус → сократил сделки и перестал терять депозит',
    type: 'success',
  },
  {
    name: 'Иван',
    result: 'после сигналов → стабильная безубыточность',
    type: 'success',
  },
  {
    name: 'Елена',
    result: 'не смогла соблюдать правила → честный кейс',
    type: 'honest',
  },
];

const ProofSection = () => {
  return (
    <section id="proof" className="py-20 md:py-28 bg-card/50">
      <div className="container-landing">
        <div className="max-w-4xl">
          <h2 className="heading-section text-foreground">
            Доказательства
          </h2>
          
          <p className="mt-4 text-lg text-muted-foreground">
            Это не быстрые успехи. Это результат отказа от хаоса.
          </p>
          
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {cases.map((item, index) => (
              <div
                key={index}
                className="p-6 bg-card border border-border rounded-xl"
              >
                <div className="flex items-center gap-3 mb-4">
                  {item.type === 'honest' ? (
                    <AlertCircle className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                  <span className="font-medium text-foreground">{item.name}</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.result}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-12 p-8 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-foreground" />
              <h3 className="text-xl font-medium text-foreground">Сделка автора</h3>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <span className="text-2xl font-semibold text-foreground">EURJPY</span>
              <span className="px-3 py-1 bg-accent text-foreground text-mono text-sm rounded-md">+16R</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-secondary/50 rounded-lg text-center">
                <p className="text-mono text-sm text-muted-foreground">W1</p>
                <p className="text-sm text-foreground mt-1">направление</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg text-center">
                <p className="text-mono text-sm text-muted-foreground">D1</p>
                <p className="text-sm text-foreground mt-1">подтверждение</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg text-center">
                <p className="text-mono text-sm text-muted-foreground">H4</p>
                <p className="text-sm text-foreground mt-1">вход</p>
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg text-center">
                <p className="text-mono text-sm text-muted-foreground">D1</p>
                <p className="text-sm text-foreground mt-1">потенциал</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10">
            <a
              href={TELEGRAM_LINKS.dm}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary group"
            >
              Получить разбор вашей торговли
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProofSection;
