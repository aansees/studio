import { NextResponse } from "next/server"

import { isUserRole } from "@/lib/constants/rbac"
import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import { searchUsersForAssignment } from "@/lib/services/team"

export async function GET(request: Request) {
  try {
    const { user } = await requireApiSession(["admin"])
    const { searchParams } = new URL(request.url)

    const query = searchParams.get("q")?.trim() ?? ""
    const limitParam = Number(searchParams.get("limit") ?? "20")
    const rolesParam = searchParams.get("roles") ?? ""
    const roles = rolesParam
      .split(",")
      .map((value) => value.trim())
      .filter((value): value is "admin" | "developer" | "client" => isUserRole(value))

    const results = await searchUsersForAssignment(user, {
      query,
      roles,
      limit: Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 20,
    })

    return NextResponse.json({ data: results })
  } catch (error) {
    return errorResponse(error)
  }
}
