"use client";
/* eslint-disable @next/next/no-img-element */

import { useParams } from "next/navigation";

import "./sample-space.css";
import Copy from "../../_components/copy/copy";
import { getProjectBySlug } from "../projects";

export default function ProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const project = slug ? getProjectBySlug(slug) : undefined;

  if (!project) {
    return (
      <div className="page sample-space">
        <section className="sample-space-hero">
          <div className="sample-space-hero-overlay"></div>
          <div className="container">
            <div className="sample-space-hero-header">
              <Copy delay={0.2} animateOnScroll={false}>
                <h1>Project not found</h1>
              </Copy>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const topGroups = project.qualityGroups.slice(0, 2);
  const bottomGroups = project.qualityGroups.slice(2, 4);

  return (
    <div className="page sample-space">
      <section className="sample-space-hero">
        <div className="sample-space-hero-img">
          <img src={project.image} alt={project.name} />
        </div>
        <div className="sample-space-hero-overlay"></div>
        <div className="container">
          <div className="sample-space-hero-header">
            <Copy delay={1} animateOnScroll={false}>
              <h1>{project.name}</h1>
            </Copy>
          </div>
          <div className="sample-space-content">
            <div className="sample-space-col">
              <Copy delay={1.05} animateOnScroll={false}>
                <p>{project.clientName}</p>
              </Copy>
            </div>
            <div className="sample-space-col">
              <div className="sample-space-content-wrapper">
                <Copy delay={1.1} animateOnScroll={false}>
                  <p>{project.region}</p>
                </Copy>
              </div>
              <div className="sample-space-content-wrapper">
                <Copy delay={1.15} animateOnScroll={false}>
                  {project.intro.map((paragraph) => (
                    <h3 key={paragraph}>{paragraph}</h3>
                  ))}
                </Copy>
              </div>
              <div className="sample-space-content-wrapper sample-space-meta">
                <div className="sample-space-hero-row">
                  <div className="sample-space-hero-sub-col">
                    <Copy delay={0.2}>
                      <p>Date Completed</p>
                      <p>{project.completed}</p>
                    </Copy>
                  </div>
                  <div className="sample-space-hero-sub-col">
                    <Copy delay={0.2}>
                      <p>Engagement</p>
                      {project.engagement.map((item) => (
                        <p key={item}>{item}</p>
                      ))}
                    </Copy>
                  </div>
                </div>
              </div>
              <div className="sample-space-content-wrapper sample-space-meta">
                <div className="sample-space-hero-row">
                  <div className="sample-space-hero-sub-col">
                    <Copy delay={0.35}>
                      <p>Collaborators</p>
                      {project.collaborators.map((item) => (
                        <p key={item}>{item}</p>
                      ))}
                    </Copy>
                  </div>
                  <div className="sample-space-hero-sub-col">
                    <Copy delay={0.35}>
                      <p>Stack</p>
                      {project.stack.map((item) => (
                        <p key={item}>{item}</p>
                      ))}
                    </Copy>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="sample-space-details sample-space-details-1">
        <div className="container">
          <div className="sample-space-col">
            <Copy delay={0.1}>
              <p>{project.storyLabel}</p>
            </Copy>
          </div>
          <div className="sample-space-col">
            <Copy delay={0.1}>
              {project.story.map((paragraph) => (
                <h3 key={paragraph}>{paragraph}</h3>
              ))}
            </Copy>
            <div className="sample-space-details-img">
              <img src={project.detailImage1} alt={`${project.name} project detail`} />
            </div>
          </div>
        </div>
      </section>
      <section className="sample-space-details sample-space-details-2">
        <div className="container">
          <div className="sample-space-col">
            <Copy delay={0.1}>
              <p>{project.qualitiesLabel}</p>
            </Copy>
          </div>
          <div className="sample-space-col">
            <div className="sample-space-content-wrapper sample-space-meta">
              <div className="sample-space-hero-row">
                {topGroups.map((group) => (
                  <div className="sample-space-hero-sub-col" key={group.label}>
                    <Copy delay={0.1}>
                      <p>{group.label}</p>
                      {group.items.map((item) => (
                        <p key={item}>{item}</p>
                      ))}
                    </Copy>
                  </div>
                ))}
              </div>
            </div>
            <div className="sample-space-content-wrapper sample-space-meta">
              <div className="sample-space-hero-row">
                {bottomGroups.map((group) => (
                  <div className="sample-space-hero-sub-col" key={group.label}>
                    <Copy delay={0.2}>
                      <p>{group.label}</p>
                      {group.items.map((item) => (
                        <p key={item}>{item}</p>
                      ))}
                    </Copy>
                  </div>
                ))}
              </div>
            </div>
            <div className="sample-space-details-img">
              <img src={project.detailImage2} alt={`${project.name} system notes`} />
            </div>
            <Copy delay={0.2}>
              <h3>{project.closing}</h3>
            </Copy>
          </div>
        </div>
      </section>
    </div>
  );
}
