import { AppSidebar } from "@/components/layout/dashboard/app-sidebar";
import { SiteHeader } from "@/components/layout/dashboard/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireSession } from "@/lib/session";
import { listProjectsForUser } from "@/lib/services/projects";
import { listTasksForUser } from "@/lib/services/tasks";

export default async function Page({ children }: { children: React.ReactNode }) {
  const { user } = await requireSession()
  const [projects, tasks] = await Promise.all([listProjectsForUser(user), listTasksForUser(user)])

  const myTasksSource =
    user.role === "client"
      ? []
      : user.role === "admin"
      ? tasks.filter((task) => task.assigneeIds?.includes(user.id))
      : tasks

  const sidebarTasks = myTasksSource
    .slice(0, 8)
    .map((task) => ({
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      status: task.status,
    }))

  const sidebarProjects = projects.slice(0, 12).map((project) => ({
    id: project.id,
    name: project.name,
    canOpenChat:
      user.role === "admin" ||
      user.role === "client" ||
      project.projectLeadId === user.id,
  }))

  return (
    <SidebarProvider
      className="flex h-dvh min-h-0 overflow-hidden"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 64)",
          "--header-height": "calc(var(--spacing) * 12 + 1px)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        variant="sidebar"
        user={{
          name: user.name,
          email: user.email,
          avatar: user.image ?? "/images/ns-avatar-1.png",
          role: user.role,
        }}
        myTasks={sidebarTasks}
        projects={sidebarProjects}
      />
      <SidebarInset className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden">
        <SiteHeader
          projects={projects.map((project) => ({
            id: project.id,
            name: project.name,
          }))}
          tasks={tasks.map((task) => ({
            id: task.id,
            title: task.title,
          }))}
        />
        <div
          data-lenis-prevent
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain"
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
