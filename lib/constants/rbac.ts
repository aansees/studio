export const USER_ROLES = ["admin", "developer", "client"] as const

export type UserRole = (typeof USER_ROLES)[number]

export const ADMIN_ROLES: UserRole[] = ["admin"]
export const BUILDER_ROLES: UserRole[] = ["admin", "developer"]

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value)
}
