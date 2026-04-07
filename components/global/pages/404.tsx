import { type ReactNode } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import Image from "next/image"

export function EmptyPage({
  media,
  title,
  description,
  actions,
  footer,
}: {
  media?: ReactNode
  title: ReactNode
  description: ReactNode
  actions?: ReactNode
  footer?: ReactNode
}) {
  return (
    <Empty>
      <EmptyHeader>
        {media ? <EmptyMedia variant="icon">{media}</EmptyMedia> : null}
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {actions ? (
        <EmptyContent className="flex-row justify-center gap-2">
          {actions}
        </EmptyContent>
      ) : null}
      {footer ?? null}
    </Empty>
  )
}

export function NoProjectsYet() {
  return (
    <EmptyPage
      media={<Image src={"/alert.png"} alt="Alert" height={500} width={500} />}
      title="No Projects Yet"
      description="No projects exist yet. Start a new project, book the consultation slot, then submit your request."
      actions={
        <>
          <Button asChild>
            <Link href="/projects/new">Start New Project</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/projects">Open Projects</Link>
          </Button>
        </>
      }
    />
  )
}
