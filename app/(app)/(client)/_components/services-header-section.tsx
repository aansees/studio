/* eslint-disable @next/next/no-img-element */

import { bodyTextClass, displayTextClass } from "./home-config";

export function ServicesHeaderSection() {
  return (
    <section
      id="services"
      className="relative flex h-screen w-screen items-center justify-center p-[2em] text-center max-[1000px]:h-auto"
    >
      <div className="flex flex-col items-center gap-[1em]">
        <div className="relative mb-[2em] h-[100px] w-[100px] overflow-hidden rounded-[1em] border-[0.25rem] border-[var(--otis-fg)] outline-[0.25rem] outline-[var(--otis-accent3)]">
          <img
            src="/images/services-header/portrait.jpeg"
            alt="Ancs Studio portrait"
            className="h-full w-full object-cover"
          />
        </div>
        <p className={bodyTextClass}>Your ideas. My toolbox.</p>
        <div className="mb-[6em]">
          <h1 className={`${displayTextClass} text-[clamp(3rem,7vw,6rem)]`}>
            Pixel wizardry
          </h1>
          <h1 className={`${displayTextClass} text-[clamp(3rem,7vw,6rem)]`}>
            served fresh
          </h1>
        </div>
        <div>
          <h1 className={`${displayTextClass} text-[clamp(3rem,7vw,6rem)]`}>
            {"\u2193"}
          </h1>
        </div>
      </div>
    </section>
  );
}
