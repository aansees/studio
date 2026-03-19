import { bodyTextClass, displayTextClass } from "./home-config";

export function ContactCtaSection() {
  return (
    <section
      id="contact"
      data-contact-cta
      className="relative flex h-[100svh] w-screen items-center justify-center p-[2em] max-[1000px]:h-auto max-[1000px]:px-[2em] max-[1000px]:py-[8em]"
    >
      <a
        href="mailto:hello@otisvalen.com"
        className="relative flex h-[300px] w-[60%] cursor-pointer flex-col items-center justify-center gap-[8px] overflow-hidden rounded-[20em] border-[0.75em] border-black bg-[linear-gradient(45deg,var(--otis-accent1),var(--otis-accent2),var(--otis-accent3),var(--otis-accent4))] bg-[length:400%_400%] shadow-[10px_10px_0px_5px_#000000] transition-transform duration-200 ease-out before:absolute before:left-0 before:top-0 before:h-full before:w-[200%] before:bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.125)_0px,rgba(0,0,0,0.125)_15px,transparent_15px,transparent_30px)] before:content-[''] hover:scale-[1.01] animate-otis-gradient before:animate-otis-stripes max-[1000px]:h-[250px] max-[1000px]:w-[95%] max-[1000px]:gap-[1em] max-[1000px]:rounded-[2em]"
      >
        <div className="relative z-[1] max-[1000px]:w-[75%] max-[1000px]:text-center">
          <p className={bodyTextClass}>Collabs, or cosmic brainstorms welcome</p>
        </div>
        <div className="relative z-[1]">
          <h1 className={`${displayTextClass} text-[7rem] max-[1000px]:text-[3rem]`}>
            Hit Me Up
          </h1>
        </div>
      </a>
    </section>
  );
}
