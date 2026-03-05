"use client"

import { useMemo, useState } from "react"
import { format, isValid, parse } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type DatePickerProps = {
  id?: string
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  buttonClassName?: string
  calendarDisabled?: React.ComponentProps<typeof Calendar>["disabled"]
}

function parseDateValue(value: string | undefined) {
  if (!value) return undefined
  const parsed = parse(value, "yyyy-MM-dd", new Date())
  return isValid(parsed) ? parsed : undefined
}

export function DatePicker({
  id,
  value,
  defaultValue,
  onValueChange,
  name,
  required,
  disabled,
  placeholder = "Pick a date",
  className,
  buttonClassName,
  calendarDisabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [internalValue, setInternalValue] = useState(defaultValue ?? "")

  const currentValue = value ?? internalValue
  const selectedDate = useMemo(() => parseDateValue(currentValue), [currentValue])

  function setNextValue(nextValue: string) {
    if (value === undefined) {
      setInternalValue(nextValue)
    }
    onValueChange?.(nextValue)
  }

  return (
    <div className={cn("space-y-1", className)}>
      {name ? (
        <input
          id={id ? `${id}-value` : undefined}
          name={name}
          required={required}
          type="hidden"
          value={currentValue}
        />
      ) : null}
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <Button
            className={cn(
              "w-full justify-between border-input bg-background px-3 font-normal hover:bg-background",
              !selectedDate && "text-muted-foreground",
              buttonClassName,
            )}
            disabled={disabled}
            id={id}
            variant="outline"
          >
            <span className={cn("truncate", !selectedDate && "text-muted-foreground")}>
              {selectedDate ? format(selectedDate, "PPP") : placeholder}
            </span>
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground/80" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-2">
          <Calendar
            defaultMonth={selectedDate}
            disabled={calendarDisabled}
            mode="single"
            onSelect={(date) => {
              if (!date) return
              setNextValue(format(date, "yyyy-MM-dd"))
              setOpen(false)
            }}
            selected={selectedDate}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
