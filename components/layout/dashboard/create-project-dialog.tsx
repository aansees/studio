"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { PROJECT_PRIORITIES, PROJECT_STATUSES } from "@/lib/constants/domain"
import { projectPriorityOptions, projectStatusOptions } from "@/lib/constants/domain-display"
import type { UserRole } from "@/lib/constants/rbac"
import { searchUserOptions, type UserSearchOption } from "@/lib/users/search-client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import MultipleSelector, { type Option } from "@/components/ui/multiselect"
import { SearchableUserSelect } from "@/components/ui/searchable-user-select"
import { Textarea } from "@/components/ui/textarea"
import { VisualSelect } from "@/components/ui/visual-select"

export type TeamUser = {
  id: string
  name: string
  email: string
  role: UserRole
}

type UserOption = UserSearchOption & Option

function UserMultiSelect({
  label,
  placeholder,
  description,
  value,
  initialOptions,
  onValueChange,
  onSearch,
}: {
  label: string
  placeholder: string
  description?: string
  value: UserOption[]
  initialOptions: UserOption[]
  onValueChange: (value: UserOption[]) => void
  onSearch: (query: string, signal?: AbortSignal) => Promise<UserOption[]>
}) {
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <MultipleSelector
        commandProps={{
          label,
        }}
        defaultOptions={initialOptions}
        emptyIndicator={<p className="text-center text-sm">No developers found</p>}
        hideClearAllButton
        hidePlaceholderWhenSelected
        onChange={(nextValue) => onValueChange(nextValue as UserOption[])}
        onSearch={onSearch}
        value={value}
        placeholder={placeholder}
      />
    </Field>
  )
}

export function CreateProjectDialog({
  users,
  currentUserId,
}: {
  users: TeamUser[]
  currentUserId: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  const leadCandidates = useMemo<UserOption[]>(
    () =>
      users
        .filter((user) => user.role === "admin" || user.role === "developer")
        .map((user) => ({
          value: user.id,
          label: user.name,
          email: user.email,
          role: user.role,
          meta: `${user.email} / ${user.role}`,
        })),
    [users],
  )
  const developerCandidates = useMemo<UserOption[]>(
    () =>
      users
        .filter((user) => user.role === "developer")
        .map((user) => ({
          value: user.id,
          label: user.name,
          email: user.email,
          role: user.role,
          meta: user.email,
        })),
    [users],
  )
  const clientCandidates = useMemo<UserOption[]>(
    () =>
      users
        .filter((user) => user.role === "client")
        .map((user) => ({
          value: user.id,
          label: user.name,
          email: user.email,
          role: user.role,
          meta: `${user.email} / ${user.role}`,
        })),
    [users],
  )
  const defaultProjectLead =
    leadCandidates.find((candidate) => candidate.value === currentUserId) ??
    leadCandidates[0] ??
    null

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<(typeof PROJECT_STATUSES)[number]>("draft")
  const [priority, setPriority] = useState<(typeof PROJECT_PRIORITIES)[number]>("medium")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [projectLead, setProjectLead] = useState<UserOption | null>(defaultProjectLead)
  const [client, setClient] = useState<UserOption | null>(null)
  const [teamMembers, setTeamMembers] = useState<UserOption[]>([])

  function resetForm() {
    setName("")
    setDescription("")
    setStatus("draft")
    setPriority("medium")
    setStartDate("")
    setEndDate("")
    setProjectLead(defaultProjectLead)
    setClient(null)
    setTeamMembers([])
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)

    if (!nextOpen && !pending) {
      resetForm()
    }
  }

  async function submitProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          projectLeadId: projectLead?.value || undefined,
          clientId: client?.value || undefined,
          teamMemberIds: teamMembers.map((member) => member.value),
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to create project")
      }

      toast.success("Project created")
      setOpen(false)
      resetForm()
      router.refresh()
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : "Unable to create project"
      toast.error(message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Create project</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Define project details, assign lead, client, and developer team members.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submitProject} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="project-name">Project Name</FieldLabel>
              <Input
                id="project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                minLength={2}
                placeholder="Delivery Partner App"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="project-description">Description</FieldLabel>
              <Textarea
                id="project-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Project overview"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel>Status</FieldLabel>
                <VisualSelect
                  value={status}
                  options={projectStatusOptions}
                  placeholder="Select status"
                  onValueChange={(value) =>
                    setStatus(value as (typeof PROJECT_STATUSES)[number])
                  }
                  triggerClassName="w-full"
                />
              </Field>
              <Field>
                <FieldLabel>Priority</FieldLabel>
                <VisualSelect
                  value={priority}
                  options={projectPriorityOptions}
                  placeholder="Select priority"
                  onValueChange={(value) =>
                    setPriority(value as (typeof PROJECT_PRIORITIES)[number])
                  }
                  triggerClassName="w-full"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="project-start-date">Start Date</FieldLabel>
                <DatePicker
                  buttonClassName="h-9 sm:h-8"
                  id="project-start-date"
                  onValueChange={setStartDate}
                  placeholder="Pick start date"
                  value={startDate}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="project-end-date">End Date</FieldLabel>
                <DatePicker
                  buttonClassName="h-9 sm:h-8"
                  id="project-end-date"
                  onValueChange={setEndDate}
                  placeholder="Pick end date"
                  value={endDate}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <SearchableUserSelect
                label="Project Lead"
                placeholder="Select project lead"
                value={projectLead}
                initialOptions={leadCandidates}
                onValueChange={setProjectLead}
                onSearch={(query, signal) =>
                  searchUserOptions(query, ["admin", "developer"], signal)
                }
                searchPlaceholder="Search project lead..."
                emptyLabel="No project lead found."
              />
              <SearchableUserSelect
                label="Client (Optional)"
                placeholder="Select client"
                value={client}
                initialOptions={clientCandidates}
                onValueChange={setClient}
                onSearch={(query, signal) =>
                  searchUserOptions(query, ["client"], signal)
                }
                searchPlaceholder="Search client..."
                emptyLabel="No client found."
                clearLabel="No client"
                allowClear
              />
            </div>

            <UserMultiSelect
              label="Team Members"
              placeholder="Search developers"
              description="Search and select multiple developers for this project."
              value={teamMembers}
              initialOptions={developerCandidates}
              onValueChange={setTeamMembers}
              onSearch={(query, signal) =>
                searchUserOptions(query, ["developer"], signal)
              }
            />
          </FieldGroup>

          <DialogFooter showCloseButton>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
