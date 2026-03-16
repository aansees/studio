"use client"

import { CheckIcon, ChevronDownIcon } from "lucide-react"
import { useEffect, useId, useState } from "react"

import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Field, FieldLabel } from "@/components/ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type SearchableUserOption = {
  value: string
  label: string
  email: string
  role: "admin" | "developer" | "client"
  meta?: string
}

export function SearchableUserSelect({
  label,
  placeholder,
  value,
  initialOptions,
  onValueChange,
  onSearch,
  searchPlaceholder,
  emptyLabel,
  clearLabel,
  allowClear = false,
}: {
  label: string
  placeholder: string
  value: SearchableUserOption | null
  initialOptions: SearchableUserOption[]
  onValueChange: (value: SearchableUserOption | null) => void
  onSearch: (query: string, signal?: AbortSignal) => Promise<SearchableUserOption[]>
  searchPlaceholder: string
  emptyLabel: string
  clearLabel?: string
  allowClear?: boolean
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [options, setOptions] = useState<SearchableUserOption[]>(initialOptions)
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebouncedValue(query, 250)

  useEffect(() => {
    setOptions(initialOptions)
  }, [initialOptions])

  useEffect(() => {
    if (!open) {
      return
    }

    const controller = new AbortController()
    let active = true

    setLoading(true)
    onSearch(debouncedQuery, controller.signal)
      .then((results) => {
        if (active) {
          setOptions(results)
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) {
          return
        }

        console.error(error)
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [debouncedQuery, onSearch, open])

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            aria-expanded={open}
            role="combobox"
            variant="outline"
            className="w-full justify-between border-input bg-background px-3 font-normal outline-none outline-offset-0 hover:bg-background focus-visible:outline-[3px]"
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value ? value.label : placeholder}
            </span>
            <ChevronDownIcon
              aria-hidden="true"
              className="shrink-0 text-muted-foreground/80"
              size={16}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-full min-w-[var(--radix-popover-trigger-width)] border-input p-0"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {loading ? (
                <div className="text-muted-foreground px-3 py-2 text-sm">
                  Searching...
                </div>
              ) : null}
              {!loading ? <CommandEmpty>{emptyLabel}</CommandEmpty> : null}
              <CommandGroup>
                {allowClear ? (
                  <CommandItem
                    value="__clear__"
                    onSelect={() => {
                      onValueChange(null)
                      setOpen(false)
                    }}
                  >
                    {clearLabel ?? "No selection"}
                    {!value ? <CheckIcon className="ml-auto" size={16} /> : null}
                  </CommandItem>
                ) : null}
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.email} ${option.role}`}
                    onSelect={() => {
                      onValueChange(option)
                      setOpen(false)
                    }}
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{option.label}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {option.email} / {option.role}
                      </span>
                    </div>
                    {value?.value === option.value ? (
                      <CheckIcon className="ml-auto" size={16} />
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </Field>
  )
}
