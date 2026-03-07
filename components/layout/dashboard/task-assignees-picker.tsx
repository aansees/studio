"use client"

import { type KeyboardEvent, useMemo, useState } from "react"
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type AssigneeOption = {
  id: string
  name: string
  email: string
  role: string
}

export function TaskAssigneesPicker({
  options,
  value,
  onChange,
  disabled,
  placeholder = "Select assignees",
}: {
  options: AssigneeOption[]
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const selectedOptions = useMemo(
    () => options.filter((option) => value.includes(option.id)),
    [options, value],
  )

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) {
      return options
    }

    return options.filter((option) => {
      return (
        option.name.toLowerCase().includes(normalized) ||
        option.email.toLowerCase().includes(normalized)
      )
    })
  }, [options, query])

  function toggleAssignee(userId: string, checked: boolean) {
    if (checked) {
      onChange(Array.from(new Set([...value, userId])))
      return
    }

    onChange(value.filter((currentId) => currentId !== userId))
  }

  function handleRowKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
    callback: () => void,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      callback()
    }
  }

  const triggerLabel =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length === 1
        ? selectedOptions[0]!.name
        : `${selectedOptions.length} assignees selected`

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
            disabled={disabled}
          >
            <span className="truncate">{triggerLabel}</span>
            <ChevronDownIcon className="size-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[360px] p-0">
          <div className="border-b p-3">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search developers"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            <div
              role="checkbox"
              aria-checked={value.length === 0}
              tabIndex={disabled ? -1 : 0}
              className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-muted"
              onClick={() => {
                if (!disabled) {
                  onChange([])
                }
              }}
              onKeyDown={(event) =>
                !disabled ? handleRowKeyDown(event, () => onChange([])) : undefined
              }
            >
              <Checkbox
                checked={value.length === 0}
                tabIndex={-1}
                aria-hidden="true"
                className="pointer-events-none"
              />
              <span className="font-medium">Unassigned</span>
            </div>
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-4 text-sm text-muted-foreground">
                No developers found.
              </div>
            ) : (
              filteredOptions.map((option) => {
                const checked = value.includes(option.id)
                return (
                  <div
                    key={option.id}
                    role="checkbox"
                    aria-checked={checked}
                    tabIndex={disabled ? -1 : 0}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      if (!disabled) {
                        toggleAssignee(option.id, !checked)
                      }
                    }}
                    onKeyDown={(event) =>
                      !disabled
                        ? handleRowKeyDown(event, () =>
                            toggleAssignee(option.id, !checked),
                          )
                        : undefined
                    }
                  >
                    <Checkbox
                      checked={checked}
                      tabIndex={-1}
                      aria-hidden="true"
                      className="pointer-events-none"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{option.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {option.email}
                      </div>
                    </div>
                    {checked ? <CheckIcon className="size-4 text-primary" /> : null}
                  </div>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>

      {selectedOptions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((option) => (
            <Badge
              key={option.id}
              variant="outline"
              className="flex items-center gap-1.5 pr-1"
            >
              <span>{option.name}</span>
              <button
                type="button"
                className="rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => toggleAssignee(option.id, false)}
                disabled={disabled}
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}
