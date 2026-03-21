"use client";

import Image from "next/image";
import Link from "next/link";
import projectEntries from "./data.json";
import { Copy } from "./copy";
import {
  bodyTextClass,
  monoTextClass,
} from "../../_components/home-config";

type ProjectRecord = (typeof projectEntries)[number];

const longCopyClass =
  "font-otis-body text-[clamp(1.05rem,1.35vw,1.45rem)] font-semibold leading-[1.12]";
const detailHeadingClass =
  "font-otis-display text-[4rem] uppercase italic leading-[0.95] max-[1000px]:text-[2rem]";
const heroEyebrowClass =
  "font-otis-body mb-[2rem] text-[1.75rem] font-semibold leading-[1.15] max-[1000px]:text-[1.125rem]";
const heroTitleClass =
  "font-otis-display text-[8rem] uppercase italic leading-[0.95] max-[1000px]:text-[3rem]";
const nextTitleClass =
  "font-otis-display text-[6rem] uppercase italic leading-[0.95] max-[1000px]:text-[2rem]";

type DetailItem = {
  label: string;
  value: string;
  tone?: "copy" | "display";
};

function DetailSection({ items }: { items: DetailItem[] }) {
  return (
    <section className="mx-auto mb-[4rem] w-[55%] px-[1rem] pb-[2rem] pt-[8rem] text-center max-[1000px]:w-full max-[1000px]:px-[1.25em] max-[1000px]:py-[6em]">
      <Copy className="w-full">
        {items.map((item) => (
          <div
            key={`${item.label}`}
            className="mb-[4rem] flex flex-col gap-[1rem]"
          >
            <p className={bodyTextClass}>{item.label}</p>
            <div className="mx-auto">
              <p
                className={
                  item.tone === "display"
                    ? detailHeadingClass
                    : `${longCopyClass} mx-auto max-w-[20ch]`
                }
              >
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </Copy>
    </section>
  );
}

export function ProjectDetailClient({ project }: { project: ProjectRecord }) {
  const projectIndex = projectEntries.findIndex(
    (entry) => entry.slug === project.slug,
  );
  const nextProject = projectEntries[(projectIndex + 1) % projectEntries.length];

  const primaryDetails: DetailItem[] = [
    {
      label: "Concept",
      value: project.background,
    },
    {
      label: "Cycle",
      value: project.date,
      tone: "display",
    },
    {
      label: "Form",
      value: project.category,
      tone: "display",
    },
    {
      label: "Medium",
      value: project.roles.join(" / "),
      tone: "display",
    },
    {
      label: "Studio",
      value: project.client,
      tone: "display",
    },
  ];

  const secondaryDetails: DetailItem[] = [
    {
      label: "Website",
      value: project.website,
      tone: "display",
    },
    {
      label: "Client",
      value: project.client,
      tone: "display",
    },
    {
      label: "Stack",
      value: project.stack.join(" / "),
    }
  ];

  const nextProjectLabel = `${String(
    ((projectIndex + 1 + projectEntries.length) % projectEntries.length) + 1,
  ).padStart(2, "0")} - ${String(projectEntries.length).padStart(2, "0")}`;

  return (
    <main className="overflow-x-hidden bg-[var(--otis-bg)] text-[var(--otis-fg)]">
      <section className="flex h-[50svh] w-screen flex-col items-center justify-end gap-[1.5em] pb-[3em] text-center max-[1000px]:px-[1.25em] max-[1000px]:pb-[3em]">
        <Copy animateOnScroll={false} delay={0.35}>
          <p className={heroEyebrowClass}>{project.category}</p>
          <h1 className={heroTitleClass}>{project.title}</h1>
        </Copy>
      </section>

      <section className="relative h-[100svh] w-full overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-full">
          <Image
            src={project.bannerImage}
            alt={`${project.title} banner`}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
      </section>

      <DetailSection items={primaryDetails} />

      <section className="bg-[var(--otis-bg)] px-[2em] py-[4em] text-[var(--otis-fg)] max-[1000px]:px-[1.25em]">
        <div className="mx-auto flex w-[75%] flex-col gap-[2em] max-[1000px]:w-full max-[1000px]:gap-[1.25em]">
          {project.snapshots.map((image, index) => (
            <div
              key={`${project.slug}-snapshot-${index + 1}`}
              className="relative h-[80svh] overflow-hidden rounded-[1rem] max-[1000px]:h-[65svh]"
            >
              <div className="absolute left-0 top-0 h-full w-full">
                <Image
                  src={image}
                  alt={`${project.title} image ${index + 1}`}
                  fill
                  sizes="(max-width: 1000px) 100vw, 75vw"
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <DetailSection items={secondaryDetails} />

      <section className="flex h-[100svh] w-screen flex-col items-center justify-center gap-[1.5em] overflow-hidden text-center max-[1000px]:p-[1.25em]">
        <Copy>
          <p className={`${monoTextClass} mb-[1rem]`}>{nextProjectLabel}</p>
          <h2 className={nextTitleClass}>Next</h2>
        </Copy>

        <Link
          href={`/featured-work/${nextProject.slug}`}
          className="relative h-[400px] w-[35%] overflow-hidden rounded-[1rem] max-[1000px]:w-[75%]"
        >
          <div className="absolute left-0 top-0 h-full w-full">
            <Image
              src={nextProject.bannerImage}
              alt={nextProject.title}
              fill
              sizes="(max-width: 1000px) 75vw, 35vw"
              className="object-cover"
            />
          </div>
        </Link>

        <Copy>
          <Link
            href={`/featured-work/${nextProject.slug}`}
            className={`${detailHeadingClass} inline-block`}
          >
            {nextProject.title}
          </Link>
        </Copy>
      </section>
    </main>
  );
}
