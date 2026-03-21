import Image from "next/image";
import Link from "next/link";
import {
  menuDetailColumns,
  menuLinks,
  menuPreviewImagePath,
  monoTextClass,
  type InternalLinkHandler,
} from "./home-config";

type HomeNavProps = {
  activeMenuTarget: string;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onInternalLinkClick: InternalLinkHandler;
};

function getMenuHref(target: string) {
  if (target === "top") {
    return "/";
  }

  if (target.startsWith("/")) {
    return target;
  }

  return `/#${target}`;
}

export function HomeNav({
  activeMenuTarget,
  isMenuOpen,
  onToggleMenu,
  onInternalLinkClick,
}: HomeNavProps) {
  const hasActiveMenuTarget = menuLinks.some(
    (menuLink) => menuLink.target === activeMenuTarget,
  );

  return (
    <>
      <nav className="pointer-events-none fixed left-0 top-0 z-[110] flex w-screen items-center justify-between p-[1.25rem] min-[1001px]:p-[2rem]">
        <div className="pointer-events-auto rounded-[0.4em] bg-[var(--otis-fg)] px-[0.65em] py-[0.5em]">
          <Link
            href="/"
            className={`${monoTextClass} text-[var(--otis-bg)]`}
          >
            Ancs {"\u2726"} Studio
          </Link>
        </div>

        <button
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="home-menu"
          onClick={onToggleMenu}
          className={`pointer-events-auto cursor-pointer rounded-[0.5rem] border border-[var(--otis-fg)]/10 px-[0.7em] pb-[0.7em] pt-[0.65em] shadow-[0_8px_24px_rgba(20,20,20,0.08)] transition-colors duration-300 ${
            isMenuOpen
              ? "bg-[var(--otis-fg)] text-[var(--otis-bg)]"
              : "bg-[color-mix(in_srgb,var(--otis-bg)_82%,white)] text-[var(--otis-fg)]"
          }`}
        >
          <span className="relative flex h-[0.95rem] flex-col items-center overflow-hidden [clip-path:polygon(0_0,100%_0,100%_100%,0%_100%)]">
            <span data-open-label className={`${monoTextClass} block`}>
              Menu
            </span>
            <span data-close-label className={`${monoTextClass} block`}>
              Close
            </span>
          </span>
        </button>
      </nav>

      <div
        id="home-menu"
        data-nav-overlay
        aria-hidden={!isMenuOpen}
        className={`fixed inset-0 z-[100] h-[100svh] w-screen overflow-hidden bg-[var(--otis-fg)] text-[var(--otis-bg)] [clip-path:polygon(0%_100%,100%_100%,100%_100%,0%_100%)] ${
          isMenuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div className="absolute left-0 top-[44%] hidden w-full -translate-y-1/2 justify-between px-[2rem] min-[1001px]:flex">
          {menuDetailColumns.map((column, columnIndex) => {
            const isRightAligned = column.align === "right";

            return (
              <div
                key={`menu-detail-column-${columnIndex + 1}`}
                className={`flex max-w-[19rem] flex-col gap-[1.5rem] ${
                  isRightAligned ? "items-end text-right" : "items-start text-left"
                }`}
              >
                {column.groups.map((group) => (
                  <div key={group.title} className="flex flex-col gap-[0.45rem]">
                    <div className="overflow-hidden">
                      <span
                        data-nav-meta-copy
                        className={`${monoTextClass} inline-block text-[var(--otis-bg)]/75 transition-colors duration-200 hover:text-[var(--otis-bg)]`}
                      >
                        {group.title}
                      </span>
                    </div>

                    {group.items.map((item) => {
                      const itemClassName = `${monoTextClass} inline-block text-[var(--otis-bg)]/75 transition-colors duration-200 hover:text-[var(--otis-bg)]`;

                      return (
                        <div
                          key={`${group.title}-${item.label}`}
                          className="overflow-hidden"
                        >
                          {item.href ? (
                            <a
                              data-nav-meta-copy
                              href={item.href}
                              target={item.href.startsWith("http") ? "_blank" : undefined}
                              rel={
                                item.href.startsWith("http")
                                  ? "noreferrer"
                                  : undefined
                              }
                              className={itemClassName}
                            >
                              {item.label}
                            </a>
                          ) : (
                            <span data-nav-meta-copy className={itemClassName}>
                              {item.label}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="pointer-events-none absolute left-1/2 top-[47%] hidden -translate-x-1/2 -translate-y-1/2 min-[1001px]:block">
          <div
            data-nav-image
            className="w-[11rem] overflow-hidden rounded-[1.1rem] border border-[var(--otis-fg)]/12 bg-[var(--otis-bg)] shadow-[0_24px_70px_rgba(20,20,20,0.12)]"
          >
            <Image
              src={menuPreviewImagePath}
              alt="Ancs Studio preview"
              width={440}
              height={616}
              className="aspect-[5/7] h-auto w-full object-cover"
            />
          </div>
        </div>

        <div
          data-nav-links-track
          className="absolute bottom-0 left-0 flex w-max items-end justify-between gap-[2rem] p-[2rem] will-change-transform max-[1000px]:w-full max-[1000px]:flex-col max-[1000px]:gap-0 max-[1000px]:p-[1.25rem]"
        >
          {menuLinks.map((link, index) => {
            const isDefaultLink = hasActiveMenuTarget
              ? link.target === activeMenuTarget
              : index === 0;

            return (
              <div
                key={link.label}
                data-nav-item
                data-nav-default={isDefaultLink ? "true" : undefined}
                className="relative overflow-hidden will-change-transform"
              >
                <a
                  data-nav-link-anchor
                  href={getMenuHref(link.target)}
                  onClick={(event) => onInternalLinkClick(event, link.target)}
                  className="relative inline-block overflow-hidden font-otis-display text-[10rem] font-[700] uppercase leading-[0.9] tracking-[-0.125rem] text-[var(--otis-bg)] [perspective:1000px] max-[1000px]:text-[4rem] max-[1000px]:tracking-[-0.05rem]"
                >
                  <span
                    data-nav-link-primary
                    data-nav-link-label
                    className="block whitespace-nowrap pt-[0.08em] pr-[0.08em] max-h-[130px]"
                  >
                    {link.label}
                  </span>
                  <span
                    data-nav-link-secondary
                    className="pointer-events-none absolute left-0 top-0 block whitespace-nowrap pt-[0.08em] pr-[0.08em] max-h-[130px]"
                  >
                    {link.label}
                  </span>
                </a>
              </div>
            );
          })}

          <div
            data-nav-highlighter
            className="pointer-events-none absolute bottom-4 left-0 hidden h-[0.75rem] bg-[var(--otis-accent1)]/80 will-change-transform min-[1001px]:block"
          />
        </div>
      </div>
    </>
  );
}
