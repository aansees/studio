"use client"

import { usePathname } from "next/navigation"

function normalizePathname(pathname: string | null) {
  if (!pathname) return "/dashboard"
  if (pathname === "/") return "/dashboard"
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname
}

function getHeaderTitle(rawPathname: string | null) {
  const pathname = normalizePathname(rawPathname)

  if (pathname === "/dashboard") return "Dashboard"
  if (pathname === "/projects") return "Projects"
  if (pathname === "/team") return "Team"
  if (pathname === "/settings") return "Account settings"
  if (pathname === "/mytask") return "My Tasks"

  if (pathname.startsWith("/tasks/")) {
    return "Task Details"
  }

  if (pathname.startsWith("/projects/")) {
    const parts = pathname.split("/").filter(Boolean)
    const section = parts[2]
    if (!section) return "Project Overview"
    if (section === "tasks" && parts[3]) return "Task Details"
    if (section === "tasks") return "Project Tasks"
    if (section === "analytics") return "Project Analytics"
    if (section === "calendar") return "Project Calendar"
    if (section === "settings") return "Project Settings"
    return "Projects"
  }

  return "Dashboard"
}

export function SiteHeader() {
  const pathname = usePathname()
  const title = getHeaderTitle(pathname)

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  )
}
