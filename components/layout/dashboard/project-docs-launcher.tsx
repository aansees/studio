"use client";

import { useRouter } from "next/navigation";

import { ImagesBadge } from "@/components/ui/images-badge";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import { Frame, FramePanel } from "@/components/ui/frame";

const previewImages = ["/file.svg", "/window.svg", "/globe.svg"];

export function ProjectDocsLauncher({
  projectId,
  title = "Project plan workspace",
  description = "Plan, resources, dev links, and credentials now live in one dedicated documentation workspace.",
  canViewInternalDocs = true,
}: {
  projectId: string;
  title?: string;
  description?: string;
  canViewInternalDocs?: boolean;
}) {
  const router = useRouter();
  const href = `/dashboard/projects/${projectId}/plan`;

  return (
    <Frame>
      <FramePanel className="flex flex-col gap-5 p-4 md:flex-row md:items-center md:justify-between md:p-5">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>
          <ImagesBadge
            text="Open project plan"
            images={previewImages}
            href={href}
            className="w-fit"
          />
          {!canViewInternalDocs ? (
            <div className="text-xs text-muted-foreground">
              Client access is limited to shared delivery context. Internal dev
              links and credential notes stay hidden.
            </div>
          ) : null}
        </div>

        <div className="shrink-0">
          <LiquidMetalButton
            label="Open plan"
            onClick={() => router.push(href)}
          />
        </div>
      </FramePanel>
    </Frame>
  );
}
