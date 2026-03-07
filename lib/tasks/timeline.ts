export function resolveTaskTimelineStartDate(
  taskCreatedAt: Date | string,
  projectStartDate?: Date | string | null,
) {
  const createdAt = new Date(taskCreatedAt)

  if (!projectStartDate) {
    return createdAt
  }

  const normalizedProjectStart = new Date(projectStartDate)
  return createdAt.getTime() < normalizedProjectStart.getTime()
    ? normalizedProjectStart
    : createdAt
}
