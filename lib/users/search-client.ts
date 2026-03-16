import type { UserRole } from "@/lib/constants/rbac"

export type UserSearchOption = {
  value: string
  label: string
  email: string
  role: UserRole
  meta?: string
}

type UserSearchResponseItem = {
  id: string
  name: string
  email: string
  role: UserRole
}

export async function searchUserOptions(
  query: string,
  roles: UserRole[],
  signal?: AbortSignal,
) {
  const searchParams = new URLSearchParams()
  searchParams.set("q", query)
  searchParams.set("roles", roles.join(","))
  searchParams.set("limit", "20")

  const response = await fetch(`/api/users/search?${searchParams.toString()}`, {
    method: "GET",
    signal,
  })

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(payload?.error ?? "Unable to search users")
  }

  return ((payload?.data as UserSearchResponseItem[] | undefined) ?? []).map((user) => ({
    value: user.id,
    label: user.name,
    email: user.email,
    role: user.role,
    meta: `${user.email} / ${user.role}`,
  }))
}
