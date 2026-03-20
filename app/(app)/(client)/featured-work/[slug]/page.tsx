import type { Metadata } from "next";
import { notFound } from "next/navigation";
import projectEntries from "./data.json";
import { ProjectDetailClient } from "./project-detail-client";

type ProjectRecord = (typeof projectEntries)[number];

type PageProps = {
  params: Promise<{ slug: string }>;
};

function getProjectBySlug(slug: string): ProjectRecord | undefined {
  return projectEntries.find((project) => project.slug === slug);
}

export function generateStaticParams() {
  return projectEntries.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project Not Found | Ancs Studio",
    };
  }

  return {
    title: `${project.title} | Featured Work | Ancs Studio`,
  };
}

export default async function FeaturedWorkProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return <ProjectDetailClient project={project} />;
}
