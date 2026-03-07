"use client"

import { usePathname } from "next/navigation"
import { ChevronRightIcon } from "lucide-react"

function normalizePathname(pathname: string | null) {
  if (!pathname) return "/dashboard"
  if (pathname === "/") return "/dashboard"
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
}

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(" ")
}

function getHeaderState(
  rawPathname: string | null,
  projectsById: Record<string, string>,
  tasksById: Record<string, string>,
) {
  const pathname = normalizePathname(rawPathname)

  if (pathname === "/dashboard") {
    return { section: "Dashboard" }
  }
  if (pathname === "/projects") {
    return { section: "Projects" }
  }
  if (pathname === "/team") {
    return { section: "Team" }
  }
  if (pathname === "/settings") {
    return { section: "Account settings" }
  }
  if (pathname === "/mytask") {
    return { section: "My Tasks" }
  }

  if (pathname.startsWith("/tasks/")) {
    const parts = pathname.split("/").filter(Boolean)
    const taskId = parts[1]
    return {
      section: "Tasks",
      title: tasksById[taskId] ?? "Task Details",
    }
  }

  if (pathname.startsWith("/projects/")) {
    const parts = pathname.split("/").filter(Boolean)
    const projectId = parts[1]
    const projectName = projectsById[projectId] ?? "Project"
    const section = parts[2]
    if (!section) {
      return { section: "Projects", title: projectName }
    }
    if (section === "details") {
      return { section: "Projects", title: `${projectName} details` }
    }
    if (section === "plan") {
      return { section: projectName, title: "Plan" }
    }
    if (section === "tasks" && parts[3]) {
      return {
        section: projectName,
        title: tasksById[parts[3]] ?? "Task Details",
      }
    }
    if (section === "tasks") {
      return { section: projectName, title: "Tasks" }
    }
    if (section === "analytics") {
      return { section: projectName, title: "Analytics" }
    }
    if (section === "calendar") {
      return { section: projectName, title: "Calendar" }
    }
    if (section === "settings") {
      return { section: projectName, title: "Settings" }
    }
    return {
      section: projectName,
      title: `${projectName} ${titleCase(section)}`,
    }
  }

  return { section: "Workspace", title: "Dashboard" }
}

export function SiteHeader({
  projects,
  tasks,
}: {
  projects: { id: string; name: string }[]
  tasks: { id: string; title: string }[]
}) {
  const pathname = usePathname()
  const projectsById = Object.fromEntries(projects.map((project) => [project.id, project.name]))
  const tasksById = Object.fromEntries(tasks.map((task) => [task.id, task.title]))
  const { section, title } = getHeaderState(pathname, projectsById, tasksById)

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="shrink-0 text-muted-foreground">{section}</span>
          {title && <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />}
          <h1 className="truncate text-base font-medium">{title}</h1>
        </div>
      </div>
    </header>
  )
}
