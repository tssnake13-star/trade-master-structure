import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Beam } from '@/components/terminal/parts';
import { ECOSYSTEM, STUDY_PRICES } from '@/lib/prices';
import { AUTHOR_STATS } from '@/lib/authorStats';
import { STUDENT_CASES } from '@/lib/testimonials';
import { PURCHASE_FAQ } from '@/lib/purchaseFaq';
import { NextBtn, SERGEY_URL, SITE_URL, go } from './tgCommon';

/** 20.10.2026, его «вкладка «Цены» в терминале школьного бота»: подписка и обучение, не выходя из Телеграма.
 *  Цены из lib/prices, те же, что на сайте. VIP здесь с ценой (его «в терминале VIP можно с ценой сделать»).
 *  Оплата у Сергея в личке, туда и кнопка.
 *  20.10.2026 вечер, его «Да, делай так, покажи сначала»: лендинг целиком сюда не ставим (его кнопки ведут в этого же
 *  бота, длинная страница в Телеграме грузится долго), а берём три блока сайта теми же словами: над ценами — автор
 *  (AuthorSection, цифры lib/authorStats) и отзывы учеников (lib/testimonials, с оговоркой), после цен — вопросы перед
 *  оплатой (lib/purchaseFaq, его порядок); внизу ссылка на полный сайт — откроется в браузере.
 *  29.10.2026: ночной облик терминала v2 (tg-v2.css); слова и цифры прежние. */
export default function TgPrices() {
  const [orig, setOrig] = useState<string | null>(null); // оригинал отзыва из Телеграма — на весь экран
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const head = (t: string) => <div className="tv2-kicker tg-head">{t}</div>;
  const price = (p: string, old?: string, per?: string) => (
    <div className="tg-price">
      <b className="num">{p}</b>
      {old ? <s className="num">{old}</s> : null}
      {per ? <span>{per}</span> : null}
    </div>
  );
  // 25.10.2026, его слово: «выделить годовую подписку и практикум… как на сайте» — на сайте практикум подсвечен лучом
  // (PackageCards, featured); здесь у него та же латунная рамка и луч, что у годовой подписки
  const study: [string, string, { price: string; oldPrice?: string; period: string }, boolean?][] = [
    ['Trade System', 'Видеообучение TRADE SYSTEM 2.0 и полный алгоритм системы. Проходите сами, в своём темпе.', STUDY_PRICES.tradeSystem],
    ['Практикум', 'Живое занятие раз в неделю, разбор ваших сделок и обратная связь по каждому решению. Набор потоками, от 3 человек.', STUDY_PRICES.practicum, true],
    ['VIP', 'Все пять этапов обучения и год сопровождения, ECHO-GATE INSIDE на год, индикаторы, скрипты и таблицы системы. Hunter_Bot и Risk Sentinel остаются у вас навсегда.', STUDY_PRICES.vip],
  ];
  // луч по рамке выделенной карточки — медленный, круг 8 с; у двух карточек разные фазы
  const beam = (on: boolean, phase: number) => (on ? <Beam fit="in" period={8} phase={phase} /> : null);
  return (
    <div className="tg-prices">
      {/* автор — блок «Автор» сайта, теми же словами, коротко */}
      {head('Автор')}
      <div className="tg-card">
        <div className="tg-author">
          <img src="/author-sergey-te.jpg" alt="Сергей Тё" />
          <div>
            <div className="tg-author-name">Сергей Тё</div>
            <div className="tg-dim">Архитектор торговых систем</div>
          </div>
        </div>
        <div className="tg-lead">15 лет в рынке. Торгую по той же системе, которую даю вам попробовать.</div>
        <div className="tg-author-lines">
          <div>
            Мои лучшие сделки — те, которые я <span className="tv2-brass">не совершил</span>
          </div>
          <div className="tg-dim">Поэтому я не учу угадывать входы</div>
          <div>Я выстраиваю систему, которая принимает решение</div>
          <div className="tg-dim">Где вы перестаёте действовать на ощущениях</div>
        </div>
        <div className="tv2-kicker tg-author-k">Практикующий трейдер · не сигнальщик, не инфобизнесмен</div>
        <div className="tg-stats">
          {AUTHOR_STATS.map((s) => (
            <div key={s.label}>
              <b className="num">
                {s.value.toFixed(s.decimals || 0).replace('.', ',')}
                {s.suffix}
              </b>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* отзывы — те же выдержки, что на сайте («04 · Отзывы»), по нажатию оригинал из Телеграма */}
      {head('Отзывы учеников')}
      <div className="tg-lead tg-lead-top">Знания у них уже были. Не хватало системы.</div>
      <div className="tg-dim tg-small">Отзывы без редактуры: в карточке выдержка, по нажатию открывается оригинал из Telegram.</div>
      <div className="tg-brass-note">Это результаты учеников, а не обещание: у кого-то получается и так, всё зависит от человека.</div>
      <div className="tg-cases">
        {STUDENT_CASES.map((c) => (
          <button key={c.image} type="button" className="tg-card tg-case" onClick={() => setOrig(c.image)}>
            <b>{c.name}</b>
            <span className="tg-dim tg-case-before">{c.before}</span>
            <span className="tg-case-q">«{c.quote}»</span>
            <span className="tg-case-go">оригинал →</span>
          </button>
        ))}
      </div>
      {orig ? (
        <div className="tg-orig" onClick={() => setOrig(null)}>
          <img src={orig} alt="Оригинал отзыва" />
          <div className="tg-dim tg-small">Нажмите, чтобы закрыть</div>
        </div>
      ) : null}

      {head('Подписка ECHO-GATE INSIDE')}
      {/* 29.10.2026: «советник» → Hunter_Bot (правило Сергея 28.10.2026: роботы называются по имени) */}
      <div className="tg-text">Терминал находит сделку, по каждому допуску я даю вердикт. Вы отмечаете точку входа и нажимаете СТАРТ, дальше сделку ведёт Hunter_Bot.</div>
      {ECOSYSTEM.map((e) => (
        <div key={e.period} className={e.featured ? 'tg-card tg-tier hot tm-sel' : 'tg-card tg-tier'}>
          {price(e.price, e.oldPrice, e.period)}
          {e.tgNote || e.saving ? <div className="tg-dim tg-small tg-tier-note">{[e.tgNote, e.saving].filter(Boolean).join(' ')}</div> : null}
          {beam(e.featured, 0)}
        </div>
      ))}
      <div className="tg-dim tg-small tg-after-tiers">Для старта нужны MT4 или MT5 у любого брокера и VPS. После оплаты возврата нет: подписка работает как аренда на срок.</div>
      <div className="tg-brass-note">Торговли без убытков не бывает, и я её не обещаю. Убыточные сделки бывают и подряд, зато риск каждой известен до входа.</div>
      {head('Обучение')}
      {study.map(([name, what, p, hot]) => (
        <div key={name} className={hot ? 'tg-card tg-tier hot tm-sel' : 'tg-card tg-tier'}>
          <div className="tg-tier-name">{name}</div>
          {price(p.price, p.oldPrice, p.period)}
          <div className="tg-dim tg-small tg-tier-note">{what}</div>
          {beam(!!hot, 4)}
        </div>
      ))}
      <div className="tg-center tg-gap-16">
        <NextBtn label="Подключиться: написать Сергею" url={SERGEY_URL} />
      </div>

      {/* вопросы перед оплатой — тот же список и порядок, что на странице цен сайта */}
      {head('Перед оплатой')}
      <div className="tg-lead tg-lead-top">Вопросы, которые стоит задать</div>
      <div className="tg-faq">
        {PURCHASE_FAQ.map((it, i) => (
          <div key={it.q} className={faqOpen === i ? 'tg-faq-row open' : 'tg-faq-row'}>
            <button type="button" className="tg-faq-q" aria-expanded={faqOpen === i} onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
              <span>{it.q}</span>
              <Plus size={18} aria-hidden="true" />
            </button>
            {faqOpen === i ? <div className="tg-faq-a">{it.a}</div> : null}
          </div>
        ))}
      </div>
      <div className="tg-dim tg-small tg-gap-12">
        Остался вопрос?{' '}
        <button type="button" className="tg-link" onClick={() => go(SERGEY_URL)}>
          Напишите Сергею
        </button>{' '}
        — без звонков, всё в Telegram.
      </div>
      <div className="tg-center tg-gap-18">
        <button type="button" className="tg-link tg-link-dim" onClick={() => go(SITE_URL)}>
          Полная страница сайта ↗
        </button>
      </div>
    </div>
  );
}
