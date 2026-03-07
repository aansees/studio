import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"
import { projectMember, user } from "@/lib/db/schema"
import { errorResponse } from "@/lib/http"
import { requireApiSession } from "@/lib/session"
import { canAccessProject } from "@/lib/services/access-control"
import { updateProjectMembersByManager } from "@/lib/services/projects"

const updateMembersSchema = z.object({
  memberIds: z.array(z.string()),
  clientIds: z.array(z.string()).optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params
    const { user: currentUser } = await requireApiSession()
    const allowed = await canAccessProject(currentUser, projectId)
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const members = await db
      .select({
        userId: projectMember.userId,
        role: projectMember.role,
        name: user.name,
        email: user.email,
      })
      .from(projectMember)
      .innerJoin(user, eq(user.id, projectMember.userId))
      .where(eq(projectMember.projectId, projectId))

    return NextResponse.json({ data: members })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { user: currentUser } = await requireApiSession()
    const { projectId } = await params
    const body = updateMembersSchema.parse(await request.json())
    await updateProjectMembersByManager(
      currentUser,
      projectId,
      body.memberIds,
      body.clientIds ?? [],
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    return errorResponse(error)
  }
}
