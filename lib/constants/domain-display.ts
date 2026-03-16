import {
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
} from "@/lib/constants/domain"

export type SelectVisualOption = {
  value: string
  label: string
  dotClassName?: string
}

function labelize(value: string) {
  return value
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

export const projectStatusOptions: SelectVisualOption[] = PROJECT_STATUSES.map((value) => ({
  value,
  label: labelize(value),
  dotClassName:
    value === "completed"
      ? "text-emerald-600"
      : value === "ongoing"
        ? "text-blue-500"
        : value === "on_hold"
          ? "text-amber-500"
          : value === "cancelled"
            ? "text-rose-500"
            : "text-slate-500",
}))

export const projectPriorityOptions: SelectVisualOption[] = PROJECT_PRIORITIES.map((value) => ({
  value,
  label: labelize(value),
  dotClassName:
    value === "low"
      ? "text-emerald-600"
      : value === "medium"
        ? "text-amber-500"
        : value === "high"
          ? "text-orange-500"
          : "text-rose-500",
}))

export const taskStatusOptions: SelectVisualOption[] = TASK_STATUSES.map((value) => ({
  value,
  label: labelize(value),
  dotClassName:
    value === "done"
      ? "text-emerald-600"
      : value === "in_progress"
        ? "text-blue-500"
        : value === "review"
          ? "text-violet-500"
          : value === "blocked"
            ? "text-rose-500"
            : "text-slate-500",
}))

export const taskPriorityOptions: SelectVisualOption[] = TASK_PRIORITIES.map((value) => ({
  value,
  label: labelize(value),
  dotClassName:
    value === "low"
      ? "text-emerald-600"
      : value === "medium"
        ? "text-amber-500"
        : value === "high"
          ? "text-orange-500"
          : "text-rose-500",
}))

export const taskTypeOptions: SelectVisualOption[] = TASK_TYPES.map((value) => ({
  value,
  label: labelize(value),
  dotClassName:
    value === "feature"
      ? "text-sky-500"
      : value === "bug"
        ? "text-rose-500"
        : value === "improvement"
          ? "text-emerald-600"
          : value === "research"
            ? "text-violet-500"
            : "text-amber-500",
}))

export function getOptionLabel(
  options: SelectVisualOption[],
  value: string,
  fallback = value,
) {
  return options.find((option) => option.value === value)?.label ?? fallback
}
