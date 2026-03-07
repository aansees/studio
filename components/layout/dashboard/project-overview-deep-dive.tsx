"use client"

import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { ProjectDocsLauncher } from "@/components/layout/dashboard/project-docs-launcher"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
}) {
  return (
    <Tabs defaultValue="details" className="w-full gap-3">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="team">Team Members</TabsTrigger>
        <TabsTrigger value="resources">Plan & Resources</TabsTrigger>
      </TabsList>

      <TabsContent value="details">
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
      </TabsContent>

      <TabsContent value="team">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Project Team</h3>
              {projectManager ? (
                <Button asChild size="sm" variant="outline">
                  <Link href={`/projects/${projectId}/settings#members`}>
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
                    members.map((member) => {
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
          </div>
      </TabsContent>

      <TabsContent value="resources">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Project Plan & Resources</h3>
            <Button asChild size="sm" variant="outline">
              <Link href={`/projects/${projectId}/plan`}>
                {projectManager ? "Open workspace" : "View workspace"}
              </Link>
            </Button>
          </div>
          <ProjectDocsLauncher
            projectId={projectId}
            canViewInternalDocs={userRole !== "client"}
            description="Use the dedicated workspace for project plan notes, resources, dev links, and credential handoff context."
          />
        </div>
      </TabsContent>
    </Tabs>
  )
}
