"use client";

import * as React from "react";
import {
  CalendarIcon,
  CalendarDaysIcon,
  ChartColumnIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  Clock3Icon,
  CircleDotIcon,
  FolderIcon,
  LayoutDashboardIcon,
  ListChecksIcon,
  MessageSquareIcon,
  Settings2Icon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavUser } from "@/components/layout/dashboard/nav-user";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { UserRole } from "@/lib/constants/rbac";
import {
  IconHelp,
  IconInnerShadowTop,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react";
import { NavSecondary } from "./nav-secondary";

type SidebarUser = {
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
};

type SidebarTask = {
  id: string;
  projectId: string;
  title: string;
};

type SidebarProject = {
  id: string;
  name: string;
  canOpenChat: boolean;
};

function normalizePathname(pathname: string | null) {
  if (!pathname) return "/dashboard";
  if (pathname === "/") return "/dashboard";
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

function getPrimaryNav(role: UserRole) {
  if (role === "admin") {
    return [
      { title: "Dashboard", href: "/dashboard", icon: <LayoutDashboardIcon /> },
      { title: "Projects", href: "/projects", icon: <FolderIcon /> },
      { title: "Team", href: "/team", icon: <UsersIcon /> },
      { title: "Event Types", href: "/bookings/event-types", icon: <CalendarDaysIcon /> },
      { title: "Bookings", href: "/bookings", icon: <CalendarIcon /> },
      { title: "Availability", href: "/bookings/availability", icon: <Clock3Icon /> },
      // { title: "Settings", href: "/settings", icon: <Settings2Icon /> },
    ];
  }

  return [
    { title: "Dashboard", href: "/dashboard", icon: <LayoutDashboardIcon /> },
    { title: "Projects", href: "/projects", icon: <FolderIcon /> },
    // { title: "Settings", href: "/settings", icon: <Settings2Icon /> },
  ];
}

function getProjectLinks(
  role: UserRole,
  projectId: string,
  canOpenChat: boolean,
) {
  if (role === "client") {
    return [
      {
        title: "Overview",
        href: `/projects/${projectId}`,
        icon: <FolderIcon />,
      },
      {
        title: "Chat",
        href: `/projects/${projectId}/chat`,
        icon: <MessageSquareIcon />,
      },
    ];
  }

  const links = [
    {
      title: "Tasks",
      href: `/projects/${projectId}/tasks`,
      icon: <ListChecksIcon />,
    },
    {
      title: "Analytics",
      href: `/projects/${projectId}/analytics`,
      icon: <ChartColumnIcon />,
    },
    {
      title: "Calendar",
      href: `/projects/${projectId}/calendar`,
      icon: <CalendarIcon />,
    },
    {
      title: "Settings",
      href: `/projects/${projectId}/settings`,
      icon: <Settings2Icon />,
    },
  ];

  if (canOpenChat) {
    links.push({
      title: "Chat",
      href: `/projects/${projectId}/chat`,
      icon: <MessageSquareIcon />,
    });
  }

  return links;
}

const navSecondary = [
  {
    title: "Settings",
    url: "/settings",
    icon: IconSettings,
  },
  {
    title: "Get Help",
    url: "#",
    icon: IconHelp,
  },
  {
    title: "Search",
    url: "#",
    icon: IconSearch,
  },
];

export function AppSidebar({
  user,
  myTasks,
  projects,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: SidebarUser;
  myTasks: SidebarTask[];
  projects: SidebarProject[];
}) {
  const pathname = usePathname();
  const currentPath = React.useMemo(
    () => normalizePathname(pathname),
    [pathname],
  );
  const navItems = getPrimaryNav(user.role);
  const showMyTasks = user.role !== "client";
  const [myTaskOpen, setMyTaskOpen] = React.useState(true);
  const [projectOpenState, setProjectOpenState] = React.useState<
    Record<string, boolean>
  >({});

  const isActive = (url: string) => {
    if (url === "/dashboard" || url === "/bookings") {
      return currentPath === url;
    }
    return currentPath === url || currentPath.startsWith(`${url}/`);
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem className="flex flex-row gap-2">
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href={"#"}>
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Ancs Studio</span>
              </Link>
            </SidebarMenuButton>
            <SidebarTrigger className="-ml-1 flex sm:hidden" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {showMyTasks ? (
          <SidebarGroup>
            <SidebarGroupContent>
              <Collapsible open={myTaskOpen} onOpenChange={setMyTaskOpen}>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <ListChecksIcon />
                        <span className="flex-1">My Tasks</span>
                        <span className="bg-muted rounded-md px-2 py-0.5 text-xs">
                          {myTasks.length}
                        </span>
                        {myTaskOpen ? (
                          <ChevronDownIcon className="size-4" />
                        ) : (
                          <ChevronRightIcon className="size-4" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {myTasks.length === 0 ? (
                          <SidebarMenuSubItem>
                            <div className="text-muted-foreground text-xs">
                              No active tasks
                            </div>
                          </SidebarMenuSubItem>
                        ) : (
                          myTasks.slice(0, 6).map((task) => (
                            <SidebarMenuSubItem key={task.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={
                                  currentPath ===
                                  `/projects/${task.projectId}/tasks/${task.id}`
                                }
                              >
                                <Link
                                  href={`/projects/${task.projectId}/tasks/${task.id}`}
                                >
                                  <CircleDotIcon className="size-3" />
                                  <span className="truncate">{task.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))
                        )}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </SidebarMenu>
              </Collapsible>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {projects.length === 0 ? (
                <SidebarMenuItem>
                  <div className="text-muted-foreground px-2 py-1 text-xs">
                    No projects found
                  </div>
                </SidebarMenuItem>
              ) : (
                projects.map((project) => {
                  const projectActive =
                    currentPath === `/projects/${project.id}` ||
                    currentPath.startsWith(`/projects/${project.id}/`);
                  const isOpen = projectOpenState[project.id] ?? projectActive;
                  const links = getProjectLinks(
                    user.role,
                    project.id,
                    project.canOpenChat,
                  );

                  return (
                    <Collapsible
                      key={project.id}
                      open={isOpen}
                      onOpenChange={(open) =>
                        setProjectOpenState((current) => ({
                          ...current,
                          [project.id]: open,
                        }))
                      }
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton isActive={projectActive}>
                            {isOpen ? (
                              <ChevronDownIcon className="size-4" />
                            ) : (
                              <ChevronRightIcon className="size-4" />
                            )}
                            <span className="truncate">{project.name}</span>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {links.map((link) => (
                              <SidebarMenuSubItem key={link.href}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={
                                    currentPath === link.href ||
                                    currentPath.startsWith(`${link.href}/`)
                                  }
                                >
                                  <Link href={link.href}>
                                    {link.icon}
                                    <span>{link.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <NavSecondary items={navSecondary} className="mt-auto" />
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
