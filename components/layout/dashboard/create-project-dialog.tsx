"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { PROJECT_PRIORITIES, PROJECT_STATUSES } from "@/lib/constants/domain"
import type { UserRole } from "@/lib/constants/rbac"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export type TeamUser = {
  id: string
  name: string
  email: string
  role: UserRole
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

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState<(typeof PROJECT_STATUSES)[number]>("draft")
  const [priority, setPriority] = useState<(typeof PROJECT_PRIORITIES)[number]>("medium")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [projectLeadId, setProjectLeadId] = useState(currentUserId)
  const [clientId, setClientId] = useState<string>("")
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([])

  const leadCandidates = useMemo(
    () => users.filter((user) => user.role === "admin" || user.role === "developer"),
    [users],
  )
  const developerCandidates = useMemo(
    () => users.filter((user) => user.role === "developer"),
    [users],
  )
  const clientCandidates = useMemo(() => users.filter((user) => user.role === "client"), [users])

  function resetForm() {
    setName("")
    setDescription("")
    setStatus("draft")
    setPriority("medium")
    setStartDate("")
    setEndDate("")
    setProjectLeadId(currentUserId)
    setClientId("")
    setTeamMemberIds([])
  }

  function toggleTeamMember(userId: string, checked: boolean) {
    setTeamMemberIds((current) => {
      if (checked) {
        return Array.from(new Set([...current, userId]))
      }
      return current.filter((id) => id !== userId)
    })
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
          projectLeadId: projectLeadId || undefined,
          clientId: clientId || undefined,
          teamMemberIds,
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
    <Dialog open={open} onOpenChange={setOpen}>
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
                <Select value={status} onValueChange={(value) => setStatus(value as (typeof PROJECT_STATUSES)[number])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STATUSES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Priority</FieldLabel>
                <Select value={priority} onValueChange={(value) => setPriority(value as (typeof PROJECT_PRIORITIES)[number])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_PRIORITIES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Field>
                <FieldLabel>Project Lead</FieldLabel>
                <Select value={projectLeadId} onValueChange={setProjectLeadId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leadCandidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.name} ({candidate.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Client (Optional)</FieldLabel>
                <Select value={clientId || "__none__"} onValueChange={(value) => setClientId(value === "__none__" ? "" : value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No client</SelectItem>
                    {clientCandidates.map((candidate) => (
                      <SelectItem key={candidate.id} value={candidate.id}>
                        {candidate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel>Team Members</FieldLabel>
              {developerCandidates.length === 0 ? (
                <FieldDescription>No developers found.</FieldDescription>
              ) : (
                <div className="grid gap-2 rounded-lg border p-3">
                  {developerCandidates.map((developer) => (
                    <label key={developer.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={teamMemberIds.includes(developer.id)}
                        onCheckedChange={(checked) => toggleTeamMember(developer.id, Boolean(checked))}
                      />
                      <span>
                        {developer.name} ({developer.email})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </Field>
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
