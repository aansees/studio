"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react"

import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type Option = {
  value: string
  label: string
  disable?: boolean
  fixed?: boolean
  meta?: string
}

type MultipleSelectorProps = {
  value?: Option[]
  onChange?: (value: Option[]) => void
  defaultOptions?: Option[]
  onSearch?: (query: string, signal?: AbortSignal) => Promise<Option[]>
  placeholder?: string
  emptyIndicator?: React.ReactNode
  loadingIndicator?: React.ReactNode
  hideClearAllButton?: boolean
  hidePlaceholderWhenSelected?: boolean
  commandProps?: {
    label?: string
  }
  disabled?: boolean
  className?: string
}

export default function MultipleSelector({
  value = [],
  onChange,
  defaultOptions = [],
  onSearch,
  placeholder = "Select options",
  emptyIndicator,
  loadingIndicator,
  hideClearAllButton = false,
  hidePlaceholderWhenSelected = false,
  disabled = false,
  className,
}: MultipleSelectorProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<Option[]>(defaultOptions)
  const debouncedQuery = useDebouncedValue(query, 250)

  const selectedValues = useMemo(() => value ?? [], [value])
  const selectedIds = useMemo(
    () => new Set(selectedValues.map((option) => option.value)),
    [selectedValues],
  )

  useEffect(() => {
    setOptions(defaultOptions)
  }, [defaultOptions])

  useEffect(() => {
    if (!open || !onSearch) {
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

  function handleSelect(option: Option) {
    if (option.disable) {
      return
    }

    if (selectedIds.has(option.value)) {
      if (option.fixed) {
        return
      }

      onChange?.(selectedValues.filter((item) => item.value !== option.value))
      return
    }

    onChange?.([...selectedValues, option])
  }

  function handleRemove(option: Option) {
    if (option.fixed) {
      return
    }

    onChange?.(selectedValues.filter((item) => item.value !== option.value))
  }

  function handleClearAll() {
    onChange?.(selectedValues.filter((item) => item.fixed))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
            className,
          )}
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {selectedValues.length > 0 ? (
              selectedValues.map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="max-w-full gap-1 pr-1"
                >
                  <span className="max-w-32 truncate">{option.label}</span>
                  {!option.fixed ? (
                    <button
                      type="button"
                      className="hover:bg-background/80 rounded-sm p-0.5"
                      onClick={(event) => {
                        event.preventDefault()
                        event.stopPropagation()
                        handleRemove(option)
                      }}
                    >
                      <XIcon className="size-3" />
                    </button>
                  ) : null}
                </Badge>
              ))
            ) : null}
            {!(hidePlaceholderWhenSelected && selectedValues.length > 0) ? (
              <span
                className={cn(
                  "truncate",
                  selectedValues.length === 0 && "text-muted-foreground",
                )}
              >
                {selectedValues.length === 0 ? placeholder : ""}
              </span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!hideClearAllButton && selectedValues.some((option) => !option.fixed) ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  handleClearAll()
                }}
              >
                <XIcon className="size-3.5" />
              </Button>
            ) : null}
            <ChevronDownIcon className="size-4 text-muted-foreground/80" />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-full min-w-[var(--radix-popover-trigger-width)] border-input p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading ? (
              <div className="text-muted-foreground px-3 py-2 text-sm">
                {loadingIndicator ?? "Searching..."}
              </div>
            ) : null}
            {!loading ? (
              <CommandEmpty>
                {emptyIndicator ?? <p className="text-center text-sm">No results found</p>}
              </CommandEmpty>
            ) : null}
            <CommandGroup>
              {options.map((option) => {
                const selected = selectedIds.has(option.value)

                return (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.meta ?? ""}`}
                    disabled={option.disable}
                    onSelect={() => handleSelect(option)}
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{option.label}</span>
                      {option.meta ? (
                        <span className="text-muted-foreground truncate text-xs">
                          {option.meta}
                        </span>
                      ) : null}
                    </div>
                    {selected ? <CheckIcon className="ml-auto size-4" /> : null}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
