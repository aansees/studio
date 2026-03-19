/* eslint-disable @next/next/no-img-element */

import { displayTextClass, serviceCards } from "./home-config";

export function ServicesStackSection() {
  return (
    <section className="flex flex-col gap-0 max-[1000px]:gap-[2em]">
      {serviceCards.map((card) => (
        <div
          key={card.id}
          data-service-card
          className="relative min-h-[300px]"
          id={card.id}
        >
          <div
            data-service-card-inner
            className={`relative mx-auto flex min-h-[500px] w-[calc(100vw-4em)] gap-[4em] rounded-[2em] p-[2em] will-change-transform max-[1000px]:min-h-0 max-[1000px]:flex-col max-[1000px]:justify-center max-[1000px]:gap-[1em] max-[1000px]:rounded-[1em] max-[1000px]:border-[0.2em] max-[1000px]:border-[var(--otis-fg)] max-[1000px]:text-center ${
              card.invertText ? "text-[var(--otis-bg)]" : "text-[var(--otis-fg)]"
            }`}
            style={{ backgroundColor: card.background }}
          >
            <div className="flex flex-[3] flex-col gap-[2em]">
              <h1 className={`${displayTextClass} text-[clamp(3rem,8vw,7rem)]`}>
                {card.title}
              </h1>
            </div>

            <div className="aspect-[4/5] flex-1 overflow-hidden rounded-[2em] max-[1000px]:aspect-[5/3] max-[1000px]:rounded-[1em] max-[1000px]:border-[0.2em] max-[1000px]:border-[var(--otis-fg)]">
              <img
                src={card.image}
                alt={card.title}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
