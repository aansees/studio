import { bodyTextClass, menuLinks, monoTextClass, type InternalLinkHandler } from "./home-config";

type HomeNavProps = {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onInternalLinkClick: InternalLinkHandler;
};

export function HomeNav({
  isMenuOpen,
  onToggleMenu,
  onInternalLinkClick,
}: HomeNavProps) {
  return (
    <>
      <nav className="fixed left-0 top-0 z-[100] flex w-screen items-center justify-between p-[2em]">
        <div className="rounded-[0.4em] bg-[var(--otis-fg)] px-[0.65em] py-[0.5em]">
          <a
            href="#top"
            onClick={(event) => onInternalLinkClick(event, "top")}
            className={`${monoTextClass} text-[var(--otis-bg)]`}
          >
            Otis {"\u2726"} Valen
          </a>
        </div>

        <button
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="home-menu"
          onClick={onToggleMenu}
          className={`cursor-pointer rounded-[0.4em] px-[0.65em] pb-[0.65em] pt-[0.6em] ${
            isMenuOpen
              ? "bg-[var(--otis-fg)] text-[var(--otis-bg)]"
              : "bg-[var(--otis-bg2)] text-[var(--otis-fg)]"
          }`}
        >
          <span className="relative flex h-[0.875rem] flex-col items-center overflow-hidden [clip-path:polygon(0_0,100%_0,100%_100%,0%_100%)]">
            <span data-open-label className={monoTextClass}>
              Menu
            </span>
            <span data-close-label className={monoTextClass}>
              Close
            </span>
          </span>
        </button>
      </nav>

      <div
        id="home-menu"
        data-nav-overlay
        aria-hidden={!isMenuOpen}
        className={`fixed inset-0 z-[90] h-[100svh] w-screen overflow-hidden bg-[var(--otis-bg2)] opacity-0 ${
          isMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div className="absolute left-1/2 top-[47.5%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-[1em]">
          {menuLinks.map((link) => (
            <div
              key={link.label}
              data-nav-item
              className={`rounded-[0.5em] ${
                link.active ? "bg-[var(--otis-fg)]" : "bg-[var(--otis-bg)]"
              }`}
            >
              <a
                href={`#${link.target}`}
                onClick={(event) => onInternalLinkClick(event, link.target)}
                className={`${bodyTextClass} block px-[0.5em] pb-[0.3em] pt-[0.5em] ${
                  link.active ? "text-[var(--otis-bg)]" : "text-[var(--otis-fg)]"
                } max-[1000px]:text-[1.5rem]`}
              >
                {link.label}
              </a>
            </div>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 flex w-full items-end justify-between gap-[1.5em] p-[2em] text-center max-[1000px]:flex-col max-[1000px]:items-center max-[1000px]:justify-center">
          <div className="flex flex-col gap-[0.5em]">
            <div
              data-nav-footer-header
              className="flex justify-start gap-[0.75em] max-[1000px]:justify-center"
            >
              <p
                className={`${monoTextClass} rounded-[0.4em] bg-[var(--otis-bg)] px-[0.65em] py-[0.5em] text-[var(--otis-fg)]`}
              >
                Find Me
              </p>
            </div>
            <div data-nav-footer-copy className="flex justify-center gap-[0.75em]">
              <a
                href="https://www.instagram.com/Admin12121web/"
                target="_blank"
                rel="noreferrer"
                className={`${monoTextClass} text-[0.75rem]`}
              >
                Instagram
              </a>
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer"
                className={`${monoTextClass} text-[0.75rem]`}
              >
                LinkedIn
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-[0.5em] max-[1000px]:hidden">
            <div data-nav-footer-copy className="flex justify-center gap-[0.75em]">
              <p className={`${monoTextClass} text-[0.75rem]`}>
                MWT - May 2025 // Admin12121
              </p>
            </div>
          </div>

          <div className="mt-[1em] flex flex-col gap-[0.5em]">
            <div
              data-nav-footer-header
              className="flex justify-end gap-[0.75em] max-[1000px]:justify-center"
            >
              <p
                className={`${monoTextClass} rounded-[0.4em] bg-[var(--otis-bg)] px-[0.65em] py-[0.5em] text-[var(--otis-fg)]`}
              >
                Say Hi
              </p>
            </div>
            <div data-nav-footer-copy className="flex justify-center gap-[0.75em]">
              <a
                href="mailto:hello@otisvalen.com"
                className={`${monoTextClass} text-[0.75rem]`}
              >
                hello@otisvalen.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
