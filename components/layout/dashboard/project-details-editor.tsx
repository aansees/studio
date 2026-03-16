"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { PROJECT_PRIORITIES, PROJECT_STATUSES } from "@/lib/constants/domain"
import { projectPriorityOptions, projectStatusOptions } from "@/lib/constants/domain-display"
import { searchUserOptions, type UserSearchOption } from "@/lib/users/search-client"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SearchableUserSelect } from "@/components/ui/searchable-user-select"
import { Textarea } from "@/components/ui/textarea"
import { VisualSelect } from "@/components/ui/visual-select"

type EditableProject = {
  name: string
  description: string | null
  status: (typeof PROJECT_STATUSES)[number]
  priority: (typeof PROJECT_PRIORITIES)[number]
  startDate: string | null
  endDate: string | null
  projectLeadId: string
}

type ProjectLeadOption = {
  id: string
  name: string
  email: string
  role: "admin" | "developer"
}

type SearchableLeadOption = UserSearchOption

export function ProjectDetailsEditor({
  projectId,
  initialProject,
  currentProjectLeadLabel,
  projectLeadOptions,
  canChangeTeamLead,
  canDeleteProject,
}: {
  projectId: string
  initialProject: EditableProject
  currentProjectLeadLabel: string
  projectLeadOptions: ProjectLeadOption[]
  canChangeTeamLead: boolean
  canDeleteProject: boolean
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [name, setName] = useState(initialProject.name)
  const [description, setDescription] = useState(initialProject.description ?? "")
  const [status, setStatus] = useState(initialProject.status)
  const [priority, setPriority] = useState(initialProject.priority)
  const [startDate, setStartDate] = useState(initialProject.startDate ?? "")
  const [endDate, setEndDate] = useState(initialProject.endDate ?? "")
  const [projectLeadId, setProjectLeadId] = useState(initialProject.projectLeadId)
  const projectLead = useMemo<SearchableLeadOption | null>(
    () =>
      projectLeadOptions
        .map((option) => ({
          value: option.id,
          label: option.name,
          email: option.email,
          role: option.role,
          meta: `${option.email} / ${option.role}`,
        }))
        .find((option) => option.value === projectLeadId) ?? null,
    [projectLeadId, projectLeadOptions],
  )
  const leadOptions = useMemo<SearchableLeadOption[]>(
    () =>
      projectLeadOptions.map((option) => ({
        value: option.id,
        label: option.name,
        email: option.email,
        role: option.role,
        meta: `${option.email} / ${option.role}`,
      })),
    [projectLeadOptions],
  )

  async function submitProjectUpdates(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          status,
          priority,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          projectLeadId: canChangeTeamLead ? projectLeadId : undefined,
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update project")
      }

      toast.success("Project updated")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update project"
      toast.error(message)
    } finally {
      setPending(false)
    }
  }

  async function deleteProject() {
    const confirmed = window.confirm(
      `Delete "${initialProject.name}"? This will remove the project, tasks, and members.`,
    )
    if (!confirmed) {
      return
    }

    setDeletePending(true)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete project")
      }

      toast.success("Project deleted")
      router.push("/projects")
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to delete project"
      toast.error(message)
    } finally {
      setDeletePending(false)
    }
  }

  return (
    <form onSubmit={submitProjectUpdates} className="space-y-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="project-name-edit">Project Name</FieldLabel>
          <Input
            id="project-name-edit"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="project-description-edit">Description</FieldLabel>
          <Textarea
            id="project-description-edit"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Project summary"
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field>
            <FieldLabel>Status</FieldLabel>
            <VisualSelect
              value={status}
              onValueChange={(value) => setStatus(value as typeof status)}
              options={projectStatusOptions}
              placeholder="Select status"
              triggerClassName="w-full"
            />
          </Field>

          <Field>
            <FieldLabel>Priority</FieldLabel>
            <VisualSelect
              value={priority}
              onValueChange={(value) => setPriority(value as typeof priority)}
              options={projectPriorityOptions}
              placeholder="Select priority"
              triggerClassName="w-full"
            />
          </Field>
          <div className="space-y-2">
            {canChangeTeamLead ? (
              <SearchableUserSelect
                label="Project Lead"
                placeholder="Select project lead"
                value={projectLead}
                initialOptions={leadOptions}
                onValueChange={(value) => setProjectLeadId(value?.value ?? "")}
                onSearch={(query, signal) =>
                  searchUserOptions(query, ["admin", "developer"], signal)
                }
                searchPlaceholder="Search project lead..."
                emptyLabel="No project lead found."
              />
            ) : (
              <Field>
                <FieldLabel>Project Lead</FieldLabel>
                <Input value={currentProjectLeadLabel} disabled />
              </Field>
            )}
            <FieldDescription>
              {canChangeTeamLead
                ? "Admins can transfer project ownership to another admin or developer."
                : "Team lead ownership can only be changed by an admin."}
            </FieldDescription>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="project-start-date-edit">Start Date</FieldLabel>
            <DatePicker
              id="project-start-date-edit"
              value={startDate}
              onValueChange={setStartDate}
              placeholder="Pick start date"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="project-end-date-edit">End Date</FieldLabel>
            <DatePicker
              id="project-end-date-edit"
              value={endDate}
              onValueChange={setEndDate}
              placeholder="Pick end date"
            />
          </Field>
        </div>
      </FieldGroup>

      <div className="flex flex-col gap-3 pt-4 md:flex-row md:items-center md:justify-between">
        {canDeleteProject ? (
          <Button
            type="button"
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => void deleteProject()}
            disabled={deletePending || pending}
          >
            {deletePending ? "Deleting..." : "Delete project"}
          </Button>
        ) : (
          <div className="text-sm text-muted-foreground">
            Team leads can update project settings, but only admins can delete the project.
          </div>
        )}

        <Button type="submit" disabled={pending || deletePending}>
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  )
}
