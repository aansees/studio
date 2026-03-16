"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { SelectVisualOption } from "@/lib/constants/domain-display"

function StatusDot({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      height="8"
      viewBox="0 0 8 8"
      width="8"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="4" cy="4" r="4" />
    </svg>
  )
}

export function VisualSelect({
  value,
  onValueChange,
  options,
  placeholder,
  triggerClassName,
  size = "default",
  disabled = false,
}: {
  value: string
  onValueChange: (value: string) => void
  options: SelectVisualOption[]
  placeholder: string
  triggerClassName?: string
  size?: "default" | "sm"
  disabled?: boolean
}) {
  const selected = options.find((option) => option.value === value)

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        size={size}
        className={`[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0 ${triggerClassName ?? ""}`}
      >
        <SelectValue placeholder={placeholder}>
          {selected ? (
            <span className="flex items-center gap-2">
              {selected.dotClassName ? (
                <StatusDot className={selected.dotClassName} />
              ) : null}
              <span>{selected.label}</span>
            </span>
          ) : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="[&_*[role=option]>span>svg]:shrink-0 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-2">
              {option.dotClassName ? <StatusDot className={option.dotClassName} /> : null}
              <span className="truncate">{option.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
