"use client"

import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { ProjectDocsLauncher } from "@/components/layout/dashboard/project-docs-launcher"
import { ProjectDocsWorkspace } from "@/components/layout/dashboard/project-docs-workspace"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TablePagination, useTablePagination } from "@/components/ui/table-pagination"
import { Frame, FramePanel } from "@/components/ui/frame"

type ProjectMemberRow = {
  userId: string
  name: string
  email: string
  role: string
  isActive: boolean
}

export function ProjectOverviewDeepDive({
  projectId,
  userRole,
  projectManager,
  details,
  members,
  embeddedWorkspace,
}: {
  projectId: string
  userRole: "admin" | "developer" | "client"
  projectManager: boolean
  details: {
    projectLead: string
    client: string
    priority: string
    startDate: string
    endDate: string
    teamMembersCount: number
  }
  members: ProjectMemberRow[]
  embeddedWorkspace?: {
    initialNotes: string
    initialDevLinks: string
    initialCredentials: string
  }
}) {
  const showEmbeddedWorkspace =
    Boolean(embeddedWorkspace) && userRole === "developer" && !projectManager
  const {
    currentPage,
    paginatedItems: visibleMembers,
    setCurrentPage,
    totalItems,
    totalPages,
  } = useTablePagination(members)

  return (
    <div className="space-y-4">
      <Frame>
        <FramePanel className="grid gap-4 p-4 text-sm md:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="text-muted-foreground">Project Lead</div>
            <div className="font-medium">{details.projectLead}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Client</div>
            <div className="font-medium">{details.client}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Priority</div>
            <div className="font-medium capitalize">{details.priority}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Start date</div>
            <div className="font-medium">{details.startDate}</div>
          </div>
          <div>
            <div className="text-muted-foreground">End date</div>
            <div className="font-medium">{details.endDate}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Team members</div>
            <div className="font-medium">{details.teamMembersCount}</div>
          </div>
        </FramePanel>
      </Frame>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Project Team</h3>
          {projectManager ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/projects/${projectId}/settings#members`}>
                <PlusIcon className="size-4" />
                Add members
              </Link>
            </Button>
          ) : null}
        </div>
        <Frame>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-16 text-center text-sm text-muted-foreground">
                    No members assigned.
                  </TableCell>
                </TableRow>
              ) : (
                visibleMembers.map((member) => {
                  const hideIdentity = userRole === "client" && member.role === "developer"
                  return (
                    <TableRow key={member.userId}>
                      <TableCell>{hideIdentity ? "Assigned developer" : member.name}</TableCell>
                      <TableCell>{hideIdentity ? "-" : member.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.role}</Badge>
                      </TableCell>
                      <TableCell>{member.isActive ? "Active" : "Disabled"}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </Frame>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setCurrentPage}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Project Plan & Resources</h3>
          {!showEmbeddedWorkspace ? (
            <Button asChild size="sm" variant="outline">
              <Link href={`/dashboard/projects/${projectId}/plan`}>
                {projectManager ? "Edit workspace" : "View workspace"}
              </Link>
            </Button>
          ) : null}
        </div>
        {showEmbeddedWorkspace && embeddedWorkspace ? (
          <div className="h-[720px] min-h-0">
            <ProjectDocsWorkspace
              projectId={projectId}
              canEdit={false}
              canViewInternalDocs={true}
              initialNotes={embeddedWorkspace.initialNotes}
              initialDevLinks={embeddedWorkspace.initialDevLinks}
              initialCredentials={embeddedWorkspace.initialCredentials}
            />
          </div>
        ) : (
          <ProjectDocsLauncher
            projectId={projectId}
            canViewInternalDocs={userRole !== "client"}
            description="Plan, resources, dev links, and credentials are managed together in the dedicated documentation workspace."
          />
        )}
      </div>
    </div>
  )
}
