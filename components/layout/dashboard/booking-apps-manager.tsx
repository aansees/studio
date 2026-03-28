"use client"

import { useMemo, useState } from "react"
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { bookingAppProviderOptions, bookingAppStatusOptions, getBookingOptionLabel } from "@/lib/constants/booking-display"
import { Badge } from "@/components/ui/badge"
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
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Frame, FramePanel } from "@/components/ui/frame"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

type BookingAppConnection = {
  id: string
  provider: string
  status: string
  accountEmail: string | null
  accountLabel: string
  externalCalendarName: string | null
  supportsCalendar: boolean
  supportsConferencing: boolean
  canCheckConflicts: boolean
  canCreateEvents: boolean
}

type FormState = {
  provider: string
  status: string
  accountLabel: string
  accountEmail: string
  externalCalendarName: string
  scopes: string
  supportsCalendar: boolean
  supportsConferencing: boolean
  canCheckConflicts: boolean
  canCreateEvents: boolean
}

const defaultFormState: FormState = {
  provider: "google_calendar",
  status: "connected",
  accountLabel: "",
  accountEmail: "",
  externalCalendarName: "",
  scopes: "",
  supportsCalendar: true,
  supportsConferencing: false,
  canCheckConflicts: true,
  canCreateEvents: true,
}

export function BookingAppsManager({
  initialConnections,
}: {
  initialConnections: BookingAppConnection[]
}) {
  const [connections, setConnections] = useState(initialConnections)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(defaultFormState)
  const [pending, setPending] = useState(false)
  const [deletePendingById, setDeletePendingById] = useState<Record<string, boolean>>({})

  const editingConnection = useMemo(
    () => connections.find((connection) => connection.id === editingId) ?? null,
    [connections, editingId],
  )

  function openCreateDialog() {
    setEditingId(null)
    setForm(defaultFormState)
    setDialogOpen(true)
  }

  function openEditDialog(connection: BookingAppConnection) {
    setEditingId(connection.id)
    setForm({
      provider: connection.provider,
      status: connection.status,
      accountLabel: connection.accountLabel,
      accountEmail: connection.accountEmail ?? "",
      externalCalendarName: connection.externalCalendarName ?? "",
      scopes: "",
      supportsCalendar: connection.supportsCalendar,
      supportsConferencing: connection.supportsConferencing,
      canCheckConflicts: connection.canCheckConflicts,
      canCreateEvents: connection.canCreateEvents,
    })
    setDialogOpen(true)
  }

  async function submitConnection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    try {
      const endpoint = editingConnection
        ? `/api/bookings/apps/${editingConnection.id}`
        : "/api/bookings/apps"
      const method = editingConnection ? "PATCH" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: form.provider,
          status: form.status,
          accountLabel: form.accountLabel,
          accountEmail: form.accountEmail || null,
          externalCalendarName: form.externalCalendarName || null,
          scopes: form.scopes || null,
          supportsCalendar: form.supportsCalendar,
          supportsConferencing: form.supportsConferencing,
          canCheckConflicts: form.canCheckConflicts,
          canCreateEvents: form.canCreateEvents,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; data?: BookingAppConnection }
        | null

      if (!response.ok || !payload?.data) {
        throw new Error(payload?.error ?? "Unable to save connected app")
      }

      setConnections((current) => {
        if (!editingConnection) {
          return [...current, payload.data as BookingAppConnection]
        }

        return current.map((item) =>
          item.id === editingConnection.id ? (payload.data as BookingAppConnection) : item,
        )
      })
      setDialogOpen(false)
      setEditingId(null)
      setForm(defaultFormState)
      toast.success("Connected app saved")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save connected app",
      )
    } finally {
      setPending(false)
    }
  }

  async function deleteConnection(connectionId: string) {
    if (!window.confirm("Remove this app connection?")) {
      return
    }

    setDeletePendingById((current) => ({ ...current, [connectionId]: true }))
    try {
      const response = await fetch(`/api/bookings/apps/${connectionId}`, {
        method: "DELETE",
      })
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to remove connected app")
      }

      setConnections((current) => current.filter((item) => item.id !== connectionId))
      toast.success("Connected app removed")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove connected app",
      )
    } finally {
      setDeletePendingById((current) => {
        const next = { ...current }
        delete next[connectionId]
        return next
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <PlusIcon className="size-4" />
              Add app
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingConnection ? "Edit connected app" : "Add connected app"}
              </DialogTitle>
              <DialogDescription>
                Store the admin connection details that event types can reference.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={submitConnection}>
              <FieldGroup>
                <Field>
                  <FieldLabel>Provider</FieldLabel>
                  <Select
                    value={form.provider}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, provider: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {bookingAppProviderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    value={form.status}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {bookingAppStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Account label</FieldLabel>
                  <Input
                    value={form.accountLabel}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        accountLabel: event.target.value,
                      }))
                    }
                    placeholder="Primary Google Calendar"
                  />
                </Field>
                <Field>
                  <FieldLabel>Account email</FieldLabel>
                  <Input
                    value={form.accountEmail}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        accountEmail: event.target.value,
                      }))
                    }
                    placeholder="calendar@example.com"
                  />
                </Field>
                <Field>
                  <FieldLabel>Calendar name</FieldLabel>
                  <Input
                    value={form.externalCalendarName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        externalCalendarName: event.target.value,
                      }))
                    }
                    placeholder="Primary"
                  />
                </Field>
              </FieldGroup>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { key: "supportsCalendar", label: "Supports calendar sync" },
                  { key: "supportsConferencing", label: "Supports conferencing" },
                  { key: "canCheckConflicts", label: "Use for conflict checking" },
                  { key: "canCreateEvents", label: "Use for event creation" },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between rounded-xl border px-4 py-3"
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                    <Switch
                      checked={Boolean(form[item.key as keyof FormState])}
                      onCheckedChange={(checked) =>
                        setForm((current) => ({
                          ...current,
                          [item.key]: checked,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving..." : "Save connection"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {connections.length === 0 ? (
        <Frame>
          <FramePanel className="p-10">
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No connected apps yet</EmptyTitle>
                <EmptyDescription>
                  Add Google, Outlook, or Zoom connection records here before
                  mapping them to event types.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </FramePanel>
        </Frame>
      ) : (
        <div className="space-y-3">
          {connections.map((connection) => (
            <Frame key={connection.id}>
              <FramePanel className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {connection.accountLabel}
                    </span>
                    <Badge variant="outline">
                      {getBookingOptionLabel(
                        bookingAppProviderOptions,
                        connection.provider,
                        connection.provider,
                      )}
                    </Badge>
                    <Badge variant="secondary">
                      {getBookingOptionLabel(
                        bookingAppStatusOptions,
                        connection.status,
                        connection.status,
                      )}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {connection.accountEmail ?? "No email"} •{" "}
                    {connection.externalCalendarName ?? "No calendar selected"}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {connection.supportsCalendar ? (
                      <Badge variant="secondary">Calendar</Badge>
                    ) : null}
                    {connection.supportsConferencing ? (
                      <Badge variant="secondary">Conferencing</Badge>
                    ) : null}
                    {connection.canCheckConflicts ? (
                      <Badge variant="secondary">Conflict check</Badge>
                    ) : null}
                    {connection.canCreateEvents ? (
                      <Badge variant="secondary">Create events</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(connection)}
                  >
                    <PencilIcon className="size-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={Boolean(deletePendingById[connection.id])}
                    onClick={() => void deleteConnection(connection.id)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </FramePanel>
            </Frame>
          ))}
        </div>
      )}
    </div>
  )
}
